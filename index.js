import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const KANTO_FIRST_ID = 1;
const KANTO_LAST_ID = 151;
let pokemonSecreto = null;
let tentativas = 0;

// Sorteia um numero de Pokedex dentro da primeira geracao (Kanto).
function sortearPokemonKantoId() {
  return Math.floor(Math.random() * KANTO_LAST_ID) + KANTO_FIRST_ID;
}

// Recebe o retorno completo da PokeAPI e deixa apenas os dados usados no jogo.
function formatarPokemon(pokemon) {
  return {
    id: pokemon.id,
    nome: pokemon.name,
    altura: pokemon.height,
    peso: pokemon.weight,
    tipos: pokemon.types.map((typeInfo) => typeInfo.type.name),
    habilidades: pokemon.abilities.map((abilityInfo) => abilityInfo.ability.name),
    imagem:
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default,
  };
}

// Escolhe um Pokemon aleatorio de Kanto e busca os dados dele na API.
export async function buscarPokemonKantoAleatorio() {
  const pokemonId = sortearPokemonKantoId();
  return buscarPokemonNaPokeApi(pokemonId);
}

// Consulta a PokeAPI usando nome ou ID e trata erros comuns da requisicao.
async function buscarPokemonNaPokeApi(nomeOuId) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${String(nomeOuId).toLowerCase().trim()}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Pokemon nao encontrado.");
    }

    throw new Error(`Erro ao consultar PokeAPI: ${response.status}`);
  }

  return formatarPokemon(await response.json());
}

// Reinicia as variaveis do jogo e guarda o Pokemon secreto da rodada.
async function iniciarJogo() {
  pokemonSecreto = await buscarPokemonKantoAleatorio();
  tentativas = 0;
  console.log(`Pokemon secreto: ${pokemonSecreto.nome}`);

  return {
    mensagem: "Jogo iniciado. Tente adivinhar o Pokemon secreto de Kanto.",
    tentativas,
  };
}

// Compara atributos numericos e devolve uma dica de maior, menor ou correto.
function compararNumero(valorChutado, valorSecreto, unidade) {
  let unidadeString = unidade;

  if (unidadeString === "ID") {
    unidadeString = "Numero da Pokedex";
  }

  if (valorChutado === valorSecreto) {
    return `Acertou ${unidadeString}: ${formatarValorNumerico(
      valorSecreto,
      unidade,
    )}.`;
  }

  return `${unidadeString} do Pokemon secreto é ${
    valorChutado < valorSecreto ? "maior" : "menor"
  }.`;
}

// Converte valores da PokeAPI para unidades mais faceis de ler na tela.
function formatarValorNumerico(valor, unidade) {
  if (unidade === "Peso") {
    return `${valor / 10} kg`;
  }

  if (unidade === "Altura") {
    return `${valor / 10} m`;
  }

  return `#${String(valor).padStart(3, "0")}`;
}

// Verifica se algum tipo do chute combina com os tipos do Pokemon secreto.
function compararTipos(tiposChutados, tiposSecretos) {
  const tiposCorretos = tiposChutados.filter((tipo) => tiposSecretos.includes(tipo));

  if (tiposCorretos.length === tiposSecretos.length) {
    return `Acertou o tipo: ${tiposSecretos.join(", ")}.`;
  }

  if (tiposCorretos.length > 0) {
    return `Acertou um dos tipos: ${tiposCorretos.join(", ")}.`;
  }

  return "Nao acertou nenhum tipo.";
}

// Avalia o chute do jogador e monta a resposta com resultado e dicas.
async function avaliarTentativa(nome) {
  if (!pokemonSecreto) {
    await iniciarJogo();
  }

  const chute = await buscarPokemonNaPokeApi(nome);
  tentativas += 1;

  if (chute.id === pokemonSecreto.id) {
    return {
      ganhou: true,
      mensagem: `Voce ganhou! Era ${pokemonSecreto.nome}.`,
      tentativas,
      pokemon: pokemonSecreto,
    };
  }

  return {
    ganhou: false,
    mensagem: `${chute.nome} nao é o Pokemon secreto.`,
    tentativas,
    chute: {
      id: chute.id,
      nome: chute.nome,
      tipos: chute.tipos,
      altura: chute.altura,
      peso: chute.peso,
      imagem: chute.imagem,
    },
    dicas: [
      compararNumero(chute.id, pokemonSecreto.id, "ID"),
      compararNumero(chute.peso, pokemonSecreto.peso, "Peso"),
      compararNumero(chute.altura, pokemonSecreto.altura, "Altura"),
      compararTipos(chute.tipos, pokemonSecreto.tipos),
    ],
  };
}

// Le o corpo da requisicao HTTP e transforma o JSON recebido em objeto.
function lerBodyJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON invalido."));
      }
    });

    req.on("error", reject);
  });
}

// Envia uma resposta HTTP no formato JSON com o status escolhido.
function responderJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

// Entrega arquivos estaticos, como o HTML, CSS e JavaScript do navegador.
async function responderArquivo(res, caminho) {
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };

  try {
    const file = await readFile(caminho);
    res.writeHead(200, {
      "Content-Type": contentTypes[extname(caminho)] || "text/plain; charset=utf-8",
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Arquivo nao encontrado");
  }
}

// Cria o servidor e direciona cada rota para a funcao correta.
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === "POST" && url.pathname === "/api/game/start") {
    try {
      responderJson(res, 200, await iniciarJogo());
    } catch (error) {
      responderJson(res, 500, { erro: error.message });
    }

    return;
  }

  if (req.method === "POST" && url.pathname === "/api/game/guess") {
    try {
      const body = await lerBodyJson(req);

      if (!body.nome || typeof body.nome !== "string") {
        responderJson(res, 400, { erro: "Digite o nome de um Pokemon." });
        return;
      }

      responderJson(res, 200, await avaliarTentativa(body.nome));
    } catch (error) {
      responderJson(res, 400, { erro: error.message });
    }

    return;
  }

  const caminho = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  await responderArquivo(res, join(__dirname, caminho));
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
