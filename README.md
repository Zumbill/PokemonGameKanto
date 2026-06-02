# Pokemon Game

Um jogo simples feito com Node.js, HTML, CSS e JavaScript. O objetivo é adivinhar qual é o Pokemon secreto da região de Kanto usando dicas de número da Pokedex, altura, peso e tipo.

## Como funciona

1. O servidor sorteia um Pokemon entre os IDs 1 e 151.
2. O jogador digita o nome de um Pokemon.
3. O backend consulta a [PokeAPI](https://pokeapi.co/) para buscar os dados do chute.
4. O jogo compara o chute com o Pokemon secreto.
5. A tela mostra dicas até o jogador acertar.

## Tecnologias usadas

- Node.js
- HTML
- CSS
- JavaScript
- PokeAPI

## Como rodar o projeto

Instale as dependencias:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Depois abra no navegador:

```text
http://localhost:3000
```

## Estrutura principal

- `index.js`: cria o servidor, consulta a PokeAPI, sorteia o Pokemon secreto e valida os chutes.
- `index.html`: contem a interface visual, os estilos e o JavaScript que conversa com o backend.
- `package.json`: guarda scripts e informacoes basicas do projeto.

## Rotas da API

### `POST /api/game/start`

Inicia uma nova rodada e sorteia um Pokemon secreto.

### `POST /api/game/guess`

Recebe um JSON com o nome do Pokemon chutado:

```json
{
  "nome": "pikachu"
}
```

Retorna se o jogador ganhou ou, caso ainda nao tenha acertado, devolve dicas para a proxima tentativa.

## Ideias para evoluir

- Adicionar um botao para reiniciar o jogo depois da vitoria.
- Criar uma lista de nomes validos para autocomplete.
- Mostrar cores diferentes para dicas certas e erradas.
- Salvar o numero de tentativas em um historico local.
