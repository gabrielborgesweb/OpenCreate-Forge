TODO: OpenCreate Forge

[x] Marcar como feito
[-] Marcar como pendente

## Alpha 3

- [ ] Migração completa de `2d` para `webgl2`

## Alpha 2

- [ ] Guias
  - [ ] Alinhar a camada com as guias com margem de 5 pixels
  - [ ] Snap da camada nas guias
  - [ ] Poder criar guias verticais e horizontais através das réguas (clicando e arrastando da régua para o canvas)
  - [ ] Poder remover guias arrastando elas de volta para a régua
  - [ ] Poder mostrar/ocultar as guias
- [ ] Ferramenta de Degradê (Gradient)
- [ ] Layer Masks
- [ ] Layer Styles (stroke, text-stroke, drop-shadow, etc)
- [ ] Layer Blending Modes
- [ ] Layer Opacity, Fill
- [x] Smart Objects
  - Smart Objects são camadas que basicamente é um projeto em JSON (armazenado em `dataObject` ao lado de `data` que guardará a renderização de `dataObject`)
  - [x] Poder converter uma camada (ou várias camadas) em Smart Object no menu de contexto das camadas
  - [x] Bloquear a pintura e edição direta em uma Smart Object, mostrando um alerta para editar o conteúdo dela
  - [x] Poder transformar a Smart Object, e deve ter `originalTransform` para guardar a transformação original e resetar no menu de contexto
  - [x] Poder editar o conteúdo de uma Smart Object, abrindo o projeto interno dela (clicando duas vezes ou no menu de contexto) em uma nova janela (igual Photoshop)
  - [x] Poder rasterizar a Smart Object, convertendo ela em uma camada de imagem normal, no menu de contexto
- [x] Layer Groups
- [x] Melhorar o manuseio das camadas
  - [x] DragOver deve detectar melhor a posição do mouse, se tiver na primeira metade ou na segunda metade do elemento
  - [x] Ao dropar uma camada no painel de camadas (que não seja um dos itens) deve dropar no final da lista
  - [x] Feedback visual de dropar em cima ou em baixo da camada não deve ocorrer na camada selecionada
  - [x] Poder selecionar múltiplas camadas com Ctrl+Click e arrastar para reordenar
  - [x] Poder selecionar múltiplas camadas com Shift+Click para selecionar um range de camadas
  - [x] Clicar e arrastar no olho para ocultar/mostrar a camada de forma rápida, sem precisar clicar em cada olho (igual Photoshop)
  - [x] Alt+Click no olho para ocultar todas as outras camadas, exceto a clicada (igual Photoshop)
- [x] Ferramenta de Preenchimento (Paint Bucket)
- [x] Menu de contexto na Home para cada projeto (Abrir, Renomear, Exportar, Export to Clipboard, Remover da Lista, Deletar)
  - [x] Bug: Exportar e Export to Clipboard não funciona
  - [x] Adicionar suporte para ter separadores no ContextMenu
- [x] Copiar o projeto para a área de transferência como imagem `Export to Clipboard` no menu `File`
- [x] Home mostrar os projetos recentes com thumbnails (será gerada ao salvar o projeto, 200x200)
- [x] Novo projeto a partir da clipboard (se houver imagem, apenas mudar o width e height do NewProjectModal para o tamanho da imagem)
- [x] Puder abrir e salvar (Ctrl+S) num arquivo de imagem (PNG, JPEG, WEBP) direta, sem precisar salvar como `.ocfd`
- [x] Modal de Preferências
  - [x] Configurações de interface (ex: tema escuro/claro, padrão escuro) (`forge:general:theme`)
  - [x] Salvamento automático (padrão desligado, intervalo de 5 minutos) (`forge:general:autosave`)
  - [x] Salvar no projeto o histórico de mudanças (padrão desligado) (`forge:general:save_history`)
  - [x] Limite de histórico de mudanças (padrão 50, maximo 200) (`forge:general:history_limit`)
- [x] Modal de Exportação Avançada
  - [x] Campos de Nome e Formato
  - [x] Exportar para multiplos formatos (PNG, JPEG, WEBP)
  - [x] Qualidade da exportação (padrão 100%)
- [x] Bug: transformar a camada aparece um clone da camada durante a transformação
- [x] Bug: é possível pintar na camada de texto, mostrar alerta ao tentar pintar
- [x] Bug: Text Tool > digitar "Lorem" > aplicar. ele renomeia a camada para "Lorem", mas ao clicar duas vezes na camada para renomear ele volta para o nome original "Text Layer"
- [x] Bug: ao pintar em uma camada atrás de outra camada, essa camada que está sendo pintada move para frente durante a pintura, mas volta para trás depois de pintar
- [x] Bug: ao dropar um projeto (`.ocfd`) no app não puxa o `filePath` (fica undefined), diferente ao abrir o projeto com Ctrl+O que puxa o `filePath` corretamente.
- [x] Bug: ao criar nova camada ele é criado no tipo da lista de camadas, ao invés em cima da camada selecionada
- [ ] Bug: o tema claro está conflitando com o tema escuro, refatorar os estilos para evitar isso

## Alpha 1

- [x] Carregar todas as fontes do sistema
  - [x] Integrar com Google Fonts
  - [x] Corrigir e verificar se todos os weights estão sendo renderizados corretamente
- [x] Salvamento local
  - [x] Ferramenta atual
  - [x] Foreground atual
  - [x] Background atual
  - [x] ToolOptions atual
- [x] Ferramenta Texto (depois de Tipos de Camada)
  - [ ] Suporte a RichText
- [-] Tipos de Camada
  - [x] Camada de Imagem (raster)
  - [-] Camada de Texto
- [x] Salvar Projeto
- [x] Régua
- [x] Poder expandir o sidebar da direita
- [x] Histórico (com descrição da mudança)
  - [x] Histórico interno para cada camada de texto
  - [x] UI em cima da aba Layers
- [x] Melhor UI/UX do NewProjectModal
  - [x] Mais opções de templates
- [x] Atalhos de Ctrl+N e Ctrl+W para gerenciar projetos
- [x] Grade de Pixels em zoom 1000%
- [x] Novo projeto ao colar uma imagem na Home
- [x] Novo projeto ao arrastar um arquivo de imagem na Home
- [x] Transformar a seleção
- [x] Dropar um arquivo de imagem como nova camada
- [x] Ocultar camada de fora do canvas, mas mostrar a camada se tiver completamente fora do canvas
- [x] Melhorar UI&UX em Camadas
  - [x] Botões de ações (Nova, Deletar)
  - [x] Reordenar
  - [x] Renomear
  - [x] Thumbnail
- [x] Ferramenta Crop
- [x] Transformar a camada
- [x] Selection Tool
  - [x] Copiar seleção e colar
- [x] Pencil Tool
- [x] Home com presets de tamanhos para Novo Projeto
- [x] Eraser Tool
  - [x] Hardness
- [x] Brush Tool
  - [x] Hardness
