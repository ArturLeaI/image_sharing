# Image Sharing

## Descrição do Projeto

O Image Sharing é uma aplicação web desenvolvida para compartilhamento de imagens entre usuários. Construída com uma arquitetura MVC (Model-View-Controller) robusta, a aplicação permite que os usuários façam upload, visualizem e gerenciem imagens em um ambiente seguro e organizado. O sistema conta com autenticação de usuários via JWT (JSON Web Token), armazenamento de imagens otimizado e uma API RESTful para integração com outros sistemas.

## Tecnologias Utilizadas

O projeto foi desenvolvido utilizando um conjunto moderno de tecnologias para garantir desempenho, segurança e manutenibilidade. A base do desenvolvimento é TypeScript, que proporciona tipagem estática ao JavaScript, facilitando a detecção de erros durante o desenvolvimento e melhorando a qualidade do código.

Para o backend, o projeto utiliza o Node.js com Express, um framework web rápido e minimalista que facilita a criação de APIs robustas. O armazenamento de dados é feito através do MongoDB, um banco de dados NoSQL orientado a documentos, acessado através do Mongoose, que proporciona uma camada de abstração para modelagem de objetos.

A autenticação e autorização são implementadas utilizando JSON Web Tokens (JWT), garantindo segurança nas operações. Para o upload e gerenciamento de arquivos, o projeto utiliza o Multer, uma middleware para manipulação de formulários multipart/form-data.

A segurança da aplicação é reforçada pelo uso do Helmet, que ajuda a proteger o aplicativo de algumas vulnerabilidades da web bem conhecidas, configurando adequadamente os cabeçalhos HTTP. A criptografia de senhas é realizada com bcrypt, garantindo que informações sensíveis sejam armazenadas de forma segura.

Para o ambiente de desenvolvimento e testes, o projeto utiliza Jest como framework de testes, permitindo a criação de testes unitários e de integração para garantir a qualidade do código. O ambiente de desenvolvimento é configurado com dotenv para gerenciamento de variáveis de ambiente.

## Estrutura do Projeto

O projeto segue uma arquitetura MVC bem definida, com a seguinte estrutura de diretórios:

- `src/`: Diretório principal do código-fonte
  - `config/`: Configurações da aplicação, incluindo conexão com banco de dados
  - `controllers/`: Controladores que gerenciam as requisições HTTP
  - `middleware/`: Middlewares para processamento de requisições
  - `models/`: Modelos de dados e esquemas do Mongoose
  - `routes/`: Definição das rotas da API
  - `test/`: Testes unitários e de integração
  - `utils/`: Funções utilitárias
  - `app.ts`: Configuração do Express e middlewares globais
  - `server.ts`: Ponto de entrada da aplicação
- `uploads/`: Diretório onde as imagens enviadas são armazenadas
- `.env`: Arquivo de variáveis de ambiente
- `jest.config.ts`: Configuração do Jest para testes
- `package.json`: Dependências e scripts do projeto
- `tsconfig.json`: Configuração do TypeScript

## Requisitos de Sistema

Para executar o projeto localmente, você precisará ter instalado em seu ambiente:

- Node.js (versão 14.x ou superior)
- npm (gerenciador de pacotes do Node)
- MongoDB (instalado localmente ou acessível remotamente)

## Configuração do Ambiente

Antes de iniciar a aplicação, é necessário configurar as variáveis de ambiente. O projeto utiliza um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
JWT_SECRET=seu_codigo_de_seguranca
MONGO_URI=mongodb://localhost:27017/image_sharing
UPLOAD_DIR=uploads
BCRYPT_SALT_ROUNDS=10
JWT_EXPIRY=1h
```

Estas variáveis configuram:
- `JWT_SECRET`: Chave secreta para assinatura dos tokens JWT
- `MONGO_URI`: URI de conexão com o banco de dados MongoDB
- `UPLOAD_DIR`: Diretório onde as imagens serão armazenadas
- `BCRYPT_SALT_ROUNDS`: Número de rounds de salt para criptografia de senhas
- `JWT_EXPIRY`: Tempo de expiração dos tokens JWT

## Instalação

Para instalar as dependências do projeto, siga os passos abaixo:

1. Clone o repositório para sua máquina local:
```
git clone https://github.com/ArturLeaI/image_sharing.git
```

2. Navegue até o diretório do projeto:
```
cd image_sharing
```

3. Instale as dependências do projeto:
```
npm install
```

4. Certifique-se de que o MongoDB está em execução em sua máquina ou acessível remotamente conforme configurado no arquivo `.env`.

5. Crie o diretório de uploads (caso não exista):
```
mkdir -p uploads
```

## Execução do Projeto

O projeto possui diferentes scripts configurados no `package.json` para facilitar o desenvolvimento e execução:

Para iniciar o servidor em modo de desenvolvimento com hot-reload:
```
npm run dev
```

Este comando utiliza o ts-node para executar o arquivo `src/server.ts` diretamente, sem necessidade de compilação prévia.

## Testes

O projeto utiliza Jest para testes unitários. Para executar os testes:
```
npm test
```

Este comando executará todos os testes definidos no diretório `src/test`.

## Rotas da API

A API do Image Sharing possui rotas para gerenciamento de usuários e imagens:

### Rotas de Usuário
- Registro de usuário
- Login de usuário
- Obtenção de perfil de usuário
- Atualização de perfil de usuário

### Rotas de Imagem
- Upload de imagem
- Listagem de imagens
- Obtenção de detalhes de imagem
- Exclusão de imagem

## Segurança

O projeto implementa várias camadas de segurança:

1. Autenticação via JWT para proteger rotas sensíveis
2. Criptografia de senhas com bcrypt
3. Proteção contra vulnerabilidades comuns com Helmet
4. Validação de dados de entrada
5. Controle de acesso baseado em usuário para operações em imagens

## Desenvolvimento

Para contribuir com o desenvolvimento do projeto, recomenda-se seguir as práticas de desenvolvimento adotadas:

1. Utilizar TypeScript para todas as implementações
2. Seguir o padrão MVC para organização do código
3. Implementar testes unitários para novas funcionalidades
4. Manter a documentação atualizada

## Conclusão

O Image Sharing é uma aplicação robusta para compartilhamento de imagens, construída com tecnologias modernas e seguindo boas práticas de desenvolvimento. A arquitetura MVC facilita a manutenção e extensão do sistema, enquanto as tecnologias escolhidas garantem desempenho e segurança.
