RADIO DIGITAL -- LEITOR DE RADIO ONLINE
=========================================================

[INICIALIZANDO SISTEMA...]
[CARREGANDO CONFIGURACOES...]
[STATUS: ONLINE]

=========================================================
    MODULO: SOBRE O PROJETO
=========================================================
{
  "nome": "Radio Digital",
  "tipo": "Web App",
  "finalidade": "Streaming de radios online",
  "contexto": "Mocambique",
  "features": [
    "pesquisa",
    "filtros por categoria/regiao",
    "favoritos",
    "player com controles",
    "tema claro/escuro"
  ]
}

=========================================================
    MODULO: FUNCIONALIDADES
=========================================================

> REPRODUCAO ____________________ [ATIVADO]
  - Streams de audio em tempo real
  - Formatos: MP3, AAC, OGG

> LISTA DE ESTACOES ______________ [ATIVADO]
  - Organizacao: regiao + categoria
  - Total: 80+ estacoes

> SISTEMA DE BUSCA _______________ [ATIVADO]
  - Campos: nome, descricao, regiao, categoria

> FAVORITOS ______________________ [ATIVADO]
  - Adicionar/remover estacoes
  - Biblioteca pessoal

> PLAYER COMPLETO ________________ [ATIVADO]
  - Controles: Play/Pause, Anterior/Proximo
  - Volume ajustavel [0-100%]
  - Indicador de buffer/loading
  - Contador de tempo de audicao [mm:ss]

> ANIMACAO VISUAL ________________ [ATIVADO]
  - Durante reproducao ativa

> TEMA CLARO/ESCURO ______________ [ATIVADO]
  - Persistencia: localStorage OK

> PERSISTENCIA DE DADOS __________ [ATIVADO]
  - Favoritos OK
  - Ultima estacao ouvida OK
  - Volume OK

> DESIGN RESPONSIVO ______________ [ATIVADO]
  - Mobile First OK

> NAVEGACAO POR ABAS _____________ [ATIVADO]
  - [1] Estacoes
  - [2] Reprodutor
  - [3] Biblioteca (Favoritos)

=========================================================
    MODULO: TECNOLOGIAS
=========================================================

+-------------------------+----------------------------------+
| TECNOLOGIA              | FINALIDADE                       |
+-------------------------+----------------------------------+
| HTML5 + CSS3            | Estrutura e estilizacao base     |
| TailwindCSS             | Estilizacao rapida e responsiva  |
| JavaScript (ES6+)       | Logica principal da aplicacao    |
| Material Symbols        | Icones da interface              |
| Web Audio API           | Streaming de audio via <audio>   |
| localStorage            | Persistencia de preferencias     |
+-------------------------+----------------------------------+

=========================================================
    MODULO: ESTRUTURA DO PROJETO
=========================================================

radio-digital/
│
├── index.html           # Pagina principal (estacoes + player)
├── podcast.html         # Pagina de podcasts (demo)
│
├── script/
│   ├── config.js        # Gerenciamento de configs/favoritos
│   └── main.js          # Logica principal (player, UI, navegacao)
│
├── estacoes/
│   └── estacoesData.js  # Base de dados (80+ estacoes)
│
└── README.md            # Documentacao

>> DATASET (estacoesData.js) <<

CAMPOS:
  - id          [string]   # Identificador unico
  - nome        [string]   # Nome da estacao
  - desc        [string]   # Breve descricao
  - regiao      [string]   # Nacional | Sul | Centro | Norte
  - categoria   [string]   # Noticias | Musica | Gospel | Desporto | Religiosa | Comunitaria
  - urlStream   [string]   # Link do stream de audio

=========================================================
    MODULO: USO DA APLICACAO
=========================================================

[ NAVEGACAO INFERIOR ]
  >> Estacoes      --> Lista completa + filtros
  >> Reprodutor    --> Controle da estacao atual
  >> Biblioteca    --> Apenas favoritos

[ FILTROS ]
  >> Busca textual --> nome | descricao
  >> Categoria     --> Noticias | Musicas | Debates | Comunitaria

[ FAVORITOS ]
  >> Clique no icone de coracao em cada estacao
  >> Acesse "Biblioteca" para visualizar

[ PLAYER ]
  >> Play/Pause
  >> Anterior/Proximo
  >> Slider de volume (persistente)
  >> Indicador "AO VIVO"
  >> Contador de tempo de audicao

[ TEMA ]
  >> Botao no canto superior direito
  >> Alterna: Claro | Escuro
  >> Persistencia via localStorage OK

[ PERSISTENCIA localStorage ]

radioAppData {
  settings: {
    theme: "dark" | "light",
    volume: number (0-100),
    lastStationId: string,
    favorites: array[string]
  },
  history: array[stationIds]
}

=========================================================
    MODULO: NOTAS TECNICAS
=========================================================

[ REPRODUCAO DE AUDIO ]
  >> Elemento: <audio> HTML5
  >> Formatos: MP3, AAC, OGG
  >> Tratamento de erros OK
  >> Buffer visual OK

[ COMPATIBILIDADE ]
  OK Chrome (Mobile/Desktop)
  OK Firefox (Mobile/Desktop)
  OK Safari (Mobile/Desktop)

  ATENCAO: Autoplay requer interacao do usuario inicial

[ MELHORIAS FUTURAS ]
  o Historico de estacoes recentes
  o Sleep timer (desligar apos X min)
  o Compartilhamento de estacao favorita
  o WebRTC para HLS/DASH
  o API de metadados (musica atual)
  o Exportar/importar favoritos

=========================================================
    MODULO: AUTOR
=========================================================

{
  "desenvolvido_por": "Projeto para contexto mocambicano",
  "foco": "Radios digitais em Mocambique",
  "ano": "2024"
}

=========================================================
    MODULO: LICENCA
=========================================================

[ STATUS: LIVRE ]

  >> Uso permitido para fins educacionais
  >> Uso permitido para fins pessoais
  >> Distribuicao livre com atribuicao

=========================================================
[ SISTEMA OPERACIONAL ]
[ STATUS: FUNCIONANDO NORMALMENTE ]
[ DATA/HORA: 2026-05-08 16:30:00 UTC ]
=========================================================