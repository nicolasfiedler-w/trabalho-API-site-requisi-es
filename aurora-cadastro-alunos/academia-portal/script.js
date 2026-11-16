

// ===================================================================
// 01. ENDEREÇO DA API
// ===================================================================
const API_BASE = "https://crudcrud.com/api/783e98bdf4e942289eecf0e2453270ef";
const API_URL = `${API_BASE.replace(/\/+$/, "")}/alunos`;

// ===================================================================
// 02. ELEMENTOS DO HTML
// ===================================================================
const form = document.getElementById("formAluno");
const campoNome = document.getElementById("nome");
const campoCurso = document.getElementById("curso");
const campoTurma = document.getElementById("turma");
const campoTurno = document.getElementById("turno");
const tabela = document.getElementById("corpoTabela");
const busca = document.getElementById("busca");
const avisoForm = document.getElementById("avisoForm");
const avisoLista = document.getElementById("avisoLista");
const estadoVazio = document.getElementById("estadoVazio");
const tituloVazio = document.getElementById("tituloVazio");
const textoVazio = document.getElementById("textoVazio");
const botaoSalvar = document.getElementById("botaoSalvar");
const textoSalvar = document.getElementById("textoSalvar");
const botaoCancelar = document.getElementById("botaoCancelar");
const botaoAtualizar = document.getElementById("botaoAtualizar");
const statusApi = document.getElementById("statusApi");
const statusBolinha = document.getElementById("statusBolinha");

// ===================================================================
// 03. VARIÁVEIS DE CONTROLE
// ===================================================================
let alunos = [];
let idEmEdicao = null;
let ocupado = false;

// ===================================================================
// 04. FUNÇÕES AUXILIARES DA INTERFACE
// ===================================================================
function apiConfigurada() {
  return API_BASE.startsWith("https://crudcrud.com/api/")
    && !API_BASE.includes("SEU_")
    && API_BASE.split("/api/")[1].trim().length > 0;
}

function alterarStatus(texto, estado = "") {
  statusApi.textContent = texto;
  statusBolinha.className = `status-dot ${estado}`;
}

function mensagemFormulario(texto, tipo = "") {
  avisoForm.textContent = texto;
  avisoForm.className = `form-alert ${tipo}`;
  avisoForm.hidden = !texto;
}

function alterarOcupado(valor) {
  ocupado = valor;
  botaoSalvar.disabled = valor;
  botaoAtualizar.disabled = valor;
  botaoSalvar.setAttribute("aria-busy", String(valor));
}

// ===================================================================
// 05. REQUISIÇÕES HTTP - FETCH, ERROS E JSON
// ===================================================================
// Todas as operações HTTP passam por aqui.
// fetch() envia a requisição e o resto da função trata erros e JSON.
async function requisicao(url, opcoes = {}) {
  let resposta;

  try {
    resposta = await fetch(url, opcoes);
  } catch {
    throw new Error("Não foi possível acessar a API. Verifique a internet ou o console (F12).");
  }

  if (!resposta.ok) {
    if (resposta.status === 404 || resposta.status === 410) {
      throw new Error("Endpoint ou registro não encontrado. Confira se sua API expirou.");
    }
    if (resposta.status === 429) {
      throw new Error("Limite de requisições atingido na CrudCrud.");
    }
    throw new Error(`A API retornou erro HTTP ${resposta.status}.`);
  }

  // PUT e DELETE podem retornar uma resposta vazia (HTTP 204).
  if (resposta.status === 204) return null;

  const conteudo = await resposta.text();
  return conteudo ? JSON.parse(conteudo) : null;
}

// ===================================================================
// 06. CONTADORES E FUNÇÕES DE ORGANIZAÇÃO (LISTA DO GET, organizar as informações na tela)
// ===================================================================
function atualizarIndicadores() {
  const cursos = new Set(alunos.map(aluno =>
    String(aluno.curso || "").trim().toLocaleLowerCase("pt-BR")
  ).filter(Boolean));

  document.getElementById("totalAlunos").textContent = String(alunos.length).padStart(2, "0");
  document.getElementById("totalCursos").textContent = String(cursos.size).padStart(2, "0");
}

function normalizar(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function criarCelula(texto, classe = "") {
  const celula = document.createElement("td");
  if (classe) celula.className = classe;
  celula.textContent = String(texto || "");
  return celula;
}

// ===================================================================
// 07. EXIBIÇÃO E PESQUISA DOS ALUNOS (exibir os alunos na tabela)
// ===================================================================
// Mostra os dados que o GET já recebeu. 

function renderizarAlunos() {
  const termo = normalizar(busca.value.trim());
  const filtrados = alunos.filter(aluno =>
    [aluno.nome, aluno.curso, aluno.turma, aluno.turno]
      .some(valor => normalizar(valor).includes(termo))
  );

  tabela.replaceChildren();
  document.getElementById("contadorLista").textContent =
    `${filtrados.length} ${filtrados.length === 1 ? "registro" : "registros"}`;

  estadoVazio.hidden = filtrados.length > 0;
  if (filtrados.length === 0) {
    tituloVazio.textContent = termo ? "Nenhum resultado" : "Nenhum aluno cadastrado";
    textoVazio.textContent = termo
      ? "Tente buscar por outro nome, curso ou turma."
      : "Use o formulário ao lado para cadastrar o primeiro aluno.";
    return;
  }

  filtrados.forEach(aluno => {
    const linha = document.createElement("tr");

    const nomeCelula = document.createElement("td");
    const identidade = document.createElement("div");
    identidade.className = "student-identity";

    const avatar = document.createElement("span");
    avatar.className = "student-avatar";
    avatar.textContent = String(aluno.nome || "A").trim().charAt(0).toUpperCase();

    const nome = document.createElement("span");
    nome.className = "student-name";
    nome.textContent = aluno.nome || "Sem nome";
    identidade.append(avatar, nome);
    nomeCelula.appendChild(identidade);

    const cursoCelula = criarCelula(aluno.curso);
    const turmaCelula = criarCelula(aluno.turma);
    const turnoCelula = document.createElement("td");
    const turno = document.createElement("span");
    turno.className = "turno-tag";
    turno.textContent = aluno.turno || "—";
    turnoCelula.appendChild(turno);

    const acoesCelula = document.createElement("td");
    const botoes = document.createElement("div");
    botoes.className = "action-buttons";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "action-button";
    editar.textContent = "Editar";
    editar.dataset.acao = "editar";
    editar.dataset.id = aluno._id;

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "action-button danger";
    excluir.textContent = "Excluir";
    excluir.dataset.acao = "excluir";
    excluir.dataset.id = aluno._id;

    botoes.append(editar, excluir);
    acoesCelula.appendChild(botoes);
    linha.append(nomeCelula, cursoCelula, turmaCelula, turnoCelula, acoesCelula);
    tabela.appendChild(linha);
  });
}

// ===================================================================
// 08. CRUD - READ / GET (CONSULTAR)
// ===================================================================
// READ / GET: consulta todos os alunos armazenados na CrudCrud online.
async function listarAlunos() {
  if (!apiConfigurada()) {
    alterarStatus("Não configurada");
    avisoLista.textContent = "Cole o seu endpoint da CrudCrud na primeira linha de configuração do script.js.";
    avisoLista.className = "list-feedback error";
    return;
  }

  botaoAtualizar.disabled = true;
  alterarStatus("Conectando...");
  avisoLista.textContent = "Buscando registros na API...";
  avisoLista.className = "list-feedback";

  try {
    // GET /alunos: solicita os registros ao servidor.
    const dados = await requisicao(API_URL, { method: "GET", cache: "no-store" });
    // Atualiza os dados temporários e mostra o resultado no HTML.
    alunos = Array.isArray(dados) ? dados : [];
    atualizarIndicadores();
    renderizarAlunos();
    alterarStatus("Conectada", "online");
    avisoLista.textContent = "Registros sincronizados com a API online.";
  } catch (erro) {
    alterarStatus("Indisponível", "offline");
    avisoLista.textContent = erro.message;
    avisoLista.className = "list-feedback error";
  } finally {
    botaoAtualizar.disabled = ocupado;
  }
}

// ===================================================================
// 09. CRUD - CREATE / POST (CADASTRAR)
// ===================================================================
// CREATE / POST: cria um aluno NOVO no recurso /alunos.
async function cadastrarAluno(dadosAluno) {
  return requisicao(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosAluno)
  });
}

// ===================================================================
// 10. CRUD - UPDATE / PUT (ATUALIZAR)
// ===================================================================
// UPDATE / PUT: atualiza um aluno existente no recurso /alunos/ID.
// A CrudCrud recebe o _id na URL, não no corpo da requisição.
async function atualizarAluno(id, dadosAluno) {
  return requisicao(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosAluno)
  });
}

// ===================================================================
// 11. CRUD - DELETE (EXCLUIR)
// ===================================================================
// DELETE: remove um aluno específico pelo _id informado na URL.
async function excluirAluno(id) {
  if (ocupado) return;
  const aluno = alunos.find(item => item._id === id);
  if (!aluno) return;

  if (!window.confirm(`Excluir o cadastro de ${aluno.nome}? Esta ação não pode ser desfeita.`)) return;

  alterarOcupado(true);
  try {
    // DELETE /alunos/ID
    await requisicao(`${API_URL}/${id}`, { method: "DELETE" });
    if (idEmEdicao === id) cancelarEdicao();
    mensagemFormulario("Aluno excluído com sucesso!", "success");
    // Novo GET para retirar o aluno excluído da tabela.
    await listarAlunos();
  } catch (erro) {
    mensagemFormulario(erro.message, "error");
  } finally {
    alterarOcupado(false);
  }
}

// ===================================================================
// 12. FUNÇÕES DO FORMULÁRIO DE EDIÇÃO (editar um aluno)
// ===================================================================
// Volta o formulário ao modo de cadastro.
function cancelarEdicao() {
  idEmEdicao = null;
  form.reset();
  textoSalvar.textContent = "Cadastrar aluno";
  document.getElementById("tituloFormulario").textContent = "Cadastrar aluno";
  document.getElementById("rotuloFormulario").textContent = "01 / NOVO REGISTRO";
  botaoCancelar.hidden = true;
  mensagemFormulario("");
}

// Preenche o formulário com os dados existentes.
// Ainda não envia PUT: o PUT acontece ao clicar em Salvar alterações.
function editarAluno(id) {
  const aluno = alunos.find(item => item._id === id);
  if (!aluno) return;

  idEmEdicao = id;
  campoNome.value = aluno.nome || "";
  campoCurso.value = aluno.curso || "";
  campoTurma.value = aluno.turma || "";
  campoTurno.value = aluno.turno || "";
  textoSalvar.textContent = "Salvar alterações";
  document.getElementById("tituloFormulario").textContent = "Editar aluno";
  document.getElementById("rotuloFormulario").textContent = "01 / EDITAR REGISTRO";
  botaoCancelar.hidden = false;
  mensagemFormulario("");
  document.getElementById("cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
  campoNome.focus({ preventScroll: true });
}

// ===================================================================
// 13. EVENTO DO FORMULÁRIO - ESCOLHER POST OU PUT (identificar quando o formulário é enviado)
// ===================================================================
// Envio do formulário: decide se deve criar (POST) ou editar (PUT).
form.addEventListener("submit", async evento => {
  evento.preventDefault();
  if (ocupado) return;
  if (!apiConfigurada()) {
    mensagemFormulario("Configure o endereço da CrudCrud no script.js antes de cadastrar.", "error");
    return;
  }

  const dadosAluno = {
    nome: campoNome.value.trim(),
    curso: campoCurso.value.trim(),
    turma: campoTurma.value.trim(),
    turno: campoTurno.value
  };

  if (Object.values(dadosAluno).some(valor => !valor)) {
    mensagemFormulario("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  const estavaEditando = Boolean(idEmEdicao);
  alterarOcupado(true);
  textoSalvar.textContent = "Salvando...";

  try {
    // Se existe idEmEdicao, edita via PUT; caso contrário, cadastra via POST.
    if (estavaEditando) {
      await atualizarAluno(idEmEdicao, dadosAluno); // UPDATE / PUT
    } else {
      await cadastrarAluno(dadosAluno);            // CREATE / POST
    }

    cancelarEdicao();
    mensagemFormulario(estavaEditando ? "Aluno atualizado com sucesso!" : "Aluno cadastrado com sucesso!", "success");
    // Faz GET novamente para mostrar os dados atualizados na tabela.
    await listarAlunos();
  } catch (erro) {
    mensagemFormulario(erro.message, "error");
    textoSalvar.textContent = estavaEditando ? "Salvar alterações" : "Cadastrar aluno";
  } finally {
    alterarOcupado(false);
  }
});

// ===================================================================
// 14. EVENTOS DOS BOTÕES E INICIALIZAÇÃO (identificar as interações do usuário)
// ===================================================================
// Quando o usuário clica em Editar ou Excluir na tabela.
tabela.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao || ocupado) return;
  if (botao.dataset.acao === "editar") editarAluno(botao.dataset.id);
  if (botao.dataset.acao === "excluir") excluirAluno(botao.dataset.id);
});

busca.addEventListener("input", renderizarAlunos);
botaoCancelar.addEventListener("click", cancelarEdicao);
// Atualizar faz uma nova consulta GET.
botaoAtualizar.addEventListener("click", listarAlunos);


listarAlunos();

// https://crudcrud.com/api/783e98bdf4e942289eecf0e2453270ef/alunos?utm_source