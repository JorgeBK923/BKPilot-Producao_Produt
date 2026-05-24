# Infraestrutura — Pilar de Testes Mobile TV (Android TV)

Documento de decisão de infraestrutura para o novo pilar de testes em Android TV / digital signage do BKPilot. Cliente piloto: VevaTV. O pilar `mobile-tv` é genérico — qualquer cliente de Android TV futuro reutiliza a mesma estrutura.

## 1. Contexto

O cliente VevaTV opera um sistema de digital signage composto por dois alvos de teste:

- **Painel web administrativo** (`painel.vevatv.online`) — cadastro, planos, unidades, vídeos, playlists e dispositivos. Coberto pela stack web atual do BKPilot.
- **Aplicativo player Android TV** — APK que roda na TV, exibe playlists de vídeo, faz pareamento via QR Code. Usa interface Leanback (navegação por controle remoto / D-pad, sem toque).

A stack mobile atual do BKPilot (`mobile-apk`) assume toque e orientação retrato. App Android TV exige navegação por D-pad e orientação paisagem. Por isso será criado um pilar dedicado `mobile-tv`, escrito do zero, sem remendos sobre o pilar phone.

## 2. Decisão de emulador

Testes em device físico foram descartados (inviável operacionalmente). A emulação será usada em todos os ambientes.

- **Engine:** Android Emulator oficial (AVD). É o único que oferece imagem Android TV com Leanback nativo. Genymotion, BrowserStack e SauceLabs não possuem catálogo Android TV.
- **Imagem do sistema:** `system-images;android-33;android-tv;x86_64` (Android 13). Versão estável, bem suportada pelo driver Appium `uiautomator2`. Caso a TV-alvo do cliente rode versão diferente, baixar também a imagem correspondente.
- **ABI:** `x86_64` — única ABI nos dois ambientes (dev e produção), evitando divergência de binário.
- **Hospedagem:** Docker Android — o emulador roda dentro de um container reproduzível. Recriar o ambiente é copiar o container, não remontar a instalação na mão.

## 3. Requisito técnico crítico — virtualização

O Android Emulator exige aceleração de virtualização para rodar em velocidade utilizável. Sem ela, a emulação cai para tradução de instruções (5 a 10× mais lenta), inviabilizando baterias de teste.

- **Linux:** exige `/dev/kvm` (KVM) disponível.
- **Windows:** exige WHPX (Windows Hypervisor Platform) ativo.
- **VPS:** exige *nested virtualization* liberada pelo provedor.

A VPS atual da Locaweb foi verificada e **não possui KVM** (`/dev/kvm` ausente). Não serve para hospedar o emulador. A VPS de produção precisará ser contratada com nested virtualization confirmada.

## 4. Ambiente 1 — Desenvolvimento e testes internos

Ambiente usado para construir o pilar `mobile-tv` e rodar ciclos pontuais de teste.

| Item | Especificação |
|---|---|
| Host | Xeon E5-2690 v4 (14 núcleos / 28 threads), 48 GB RAM — máquina já disponível |
| Sistema operacional | Windows |
| Virtualização | WHPX (Windows Hypervisor Platform) — ativar em "Recursos do Windows" e confirmar VT-x ligado na BIOS |
| Docker | Docker Desktop com backend WSL2 |
| Capacidade | Folgada — suporta múltiplos emuladores simultâneos |

A máquina atende com sobra. CPU de 2016 sem GPU dedicada potente: o emulador roda headless com render por software (`swiftshader_indirect`), suficiente para reprodução de vídeo de signage.

## 5. Ambiente 2 — Produção (VPS a contratar)

VPS dedicada à operação contínua do pilar. Requisito inegociável: nested virtualization confirmada com o provedor antes da contratação.

| Item | Mínimo | Recomendado |
|---|---|---|
| Nested virtualization / KVM | obrigatório | obrigatório |
| vCPU | 4 | 8 |
| RAM | 8 GB | 16 GB |
| Disco | 40 GB SSD | 80 GB SSD |
| Sistema operacional | Ubuntu Server 22.04 LTS | Ubuntu Server 22.04 LTS |
| Arquitetura | x86_64 | x86_64 |

### Provedores avaliados

| Provedor | Plano | Nested virtualization | Custo aproximado |
|---|---|---|---|
| Hetzner | CCX (vCPU dedicado) | Liberado oficialmente | ~€30/mês (16 GB) |
| Oracle Cloud | Free tier Ampere (ARM) | Sim (ARM nativo) | Gratuito — porém ABI arm64 |
| OVHcloud | Bare metal | Sim em bare metal | Variável |
| Locaweb | VPS comum | Não disponível | — |
| Locaweb | Servidor dedicado | Possível — exige ticket | Mais elevado |

**Recomendação de produção:** Hetzner CCX. É x86_64 (mesma ABI do ambiente de desenvolvimento, sem divergência de imagem), tem nested virtualization liberada oficialmente e custo previsível. Caso a empresa exija fornecedor nacional com nota fiscal brasileira, abrir ticket na Locaweb solicitando servidor dedicado com VT-x exposto, confirmando por escrito antes de assinar.

## 6. Software necessário (ambos os ambientes)

- Android SDK — `cmdline-tools`, `platform-tools`, `emulator`
- System image `android-33;android-tv;x86_64`
- Appium 2 com driver `uiautomator2`
- Node.js (runtime do pilar BKPilot)
- Docker (imagem Android reproduzível)
- ffmpeg (conversão de vídeo de evidência — já presente no BKPilot)

## 7. Validações antes do uso

- VT-x / AMD-V ativo — BIOS no Xeon; confirmação do provedor na VPS
- `/dev/kvm` existente (Linux) ou WHPX ativo (Windows)
- `egrep -c '(vmx|svm)' /proc/cpuinfo` retornando valor maior que zero
- Appium respondendo no endpoint configurado
- AVD Android TV iniciando em modo headless
- Acesso de rede ao painel de homologação do cliente — validar VPN/rota com `preflight:vpn` antes do teste
- Saída de rede para download de APK quando necessário

## 8. Stack fechado

| Camada | Desenvolvimento | Produção |
|---|---|---|
| Host | Xeon E5-2690 v4, 48 GB | Hetzner CCX |
| Sistema operacional | Windows | Ubuntu Server 22.04 LTS |
| Virtualização | WHPX | KVM (nested) |
| ABI | x86_64 | x86_64 |
| Imagem do emulador | `android-33;android-tv;x86_64` | `android-33;android-tv;x86_64` |
| Hospedagem do emulador | Docker Desktop | Docker Android |

A ABI única (`x86_64`) nos dois ambientes garante que o pilar `mobile-tv` seja escrito uma única vez e rode de forma idêntica em desenvolvimento e produção.

## 9. Próximos passos

- Contratar VPS de produção com nested virtualization confirmada
- Ativar WHPX e VT-x no host de desenvolvimento (Xeon)
- Iniciar a construção do pilar genérico `mobile-tv` — `tv-doctor.js`, navegação Leanback e as skills `explorar-mobile-tv`, `gerar-cenarios-mobile-tv`, `testar-modulo-mobile-tv`, `executar-planilha-mobile-tv` e `gerar-relatorio-final-tv`
