# Instagram Follow Manager

Aplicativo web em português para comparar os dados da sua exportação oficial do Instagram e organizar revisões manuais. Usa React, TypeScript, Vite, Tailwind CSS, Lucide, Zustand, IndexedDB e Recharts. Os dados da conta são processados e armazenados no navegador.

## Instalação

Pré-requisito: Node.js 22.12 ou superior e npm. Extraia o ZIP, abra um terminal na pasta do projeto e execute:

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

Para compilar e conferir a versão de produção:

```sh
npm run build
npm run preview
```

## Importar a exportação oficial

1. Na Central de Contas da Meta, solicite uma exportação dos **seguidores e seguindo** da conta correta. Selecione **Todo o período** para comparar listas completas e escolha JSON ou HTML.
2. Extraia o ZIP. Na pasta de seguidores e seguindo, selecione `following.json` ou `following.html` e todos os arquivos de seguidores, como `followers_1.json`, `followers_2.json` ou as versões em HTML. O app também aceita arquivos sem numeração e listas de seguidos divididas em páginas.
3. Abra **Importar dados**, selecione os arquivos da mesma exportação e confirme. O app deduplica nomes sem distinção de maiúsculas e minúsculas. Uma importação inválida preserva os dados anteriores.

Ao atualizar, a exportação mais recente substitui a comparação, preserva o histórico e remove da fila os perfis que já saíram da lista **Seguindo**. Use sempre arquivos da mesma conta. A data do painel e do gráfico indica quando os arquivos foram importados. Os totais refletem o conteúdo dos arquivos importados.

## Revisar perfis

- Em **Perfis**, pesquise por nome de usuário, use os filtros e adicione perfis à fila. O botão de edição abre categorias de proteção e listas personalizadas.
- Em **Fila de revisão**, inicie uma sessão e abra o perfil oficial. Faça o unfollow no próprio Instagram e volte para clicar em **Marcar como removido**. A confirmação registra sua decisão localmente. O app não consulta o Instagram para verificá-la.
- **Pular** registra a decisão e move o perfil para o fim da fila. A meta conta perfis distintos revisados na sessão. **Manter seguindo** e **Adicionar à lista protegida** retiram o perfil da fila. Remova a categoria para voltar a incluir um perfil protegido.
- Configure a meta e os lembretes em **Configurações** antes de iniciar uma sessão. As sessões podem ser pausadas, retomadas e encerradas. Se o Instagram exibir avisos, restrições ou desafios de segurança, interrompa as ações e siga as orientações oficiais.
- Em **Histórico**, exporte as decisões em CSV ou um relatório JSON com decisões, sessões e totais de importação. Esses relatórios são para consulta e análise.

## Vercel

1. Suba o código do projeto em um repositório Git e crie um projeto na Vercel a partir dele.
2. Selecione a pasta que contém `package.json` como raiz. O arquivo `vercel.json` já define o preset Vite, o comando `npm run build` e a saída `dist`. Use Node.js 22.x ou 24.x.
3. Publique o projeto. A aplicação é estática e dispensa backend, conta de serviço ou variáveis de ambiente.

Cada endereço do app tem seu próprio IndexedDB. A versão publicada começa vazia. Os dados locais de outro navegador ou do servidor de desenvolvimento não são transferidos.

## Estrutura

```text
src/
  App.tsx                 Navegação e feedback
  Dashboard.tsx           Indicadores e resumo da fila
  EvolutionChart.tsx      Evolução por importação
  Profiles.tsx            Tabela, busca, filtros e listas
  ReviewQueue.tsx          Fila e controles de sessão
  History.tsx             Histórico de decisões e sessões
  Settings.tsx            Aparência, metas e lembretes
  ImportDialog.tsx        Seleção e validação dos arquivos
  importer.ts             Leitura local de JSON e HTML
  import-names.ts         Identificação de arquivos oficiais
  store.ts                Estado e transações IndexedDB
  domain.ts               Tipos e regras de domínio
  report.ts               Exportação CSV e JSON
  ui.tsx                  Elementos de interface compartilhados
  styles.css              Temas e layout responsivo
```

## Privacidade

O app não pede senha, cookies ou tokens do Instagram. Os links abrem perfis oficiais em uma aba separada. Arquivos importados jamais são enviados a um servidor. Limpar os dados do site ou usar outro navegador pode tornar indisponíveis as importações e decisões guardadas neste dispositivo.
