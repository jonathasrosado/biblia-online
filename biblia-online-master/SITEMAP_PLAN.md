# Planejamento de Sitemap e Estrutura de Links - Bíblia Online

Este documento detalha a estrutura completa de URLs do seu site, garantindo que todo o conteúdo seja acessível e indexável pelo Google.

## 1. Páginas Estáticas (Core)
Estas são as páginas principais do site, acessíveis a partir do menu ou rodapé.

| Página | URL | Prioridade | Importância |
| :--- | :--- | :--- | :--- |
| **Home** | `https://biblia.com/` | 1.0 | Página principal, porta de entrada. |
| **Blog (Index)** | `https://biblia.com/blog` | 0.9 | Hub de conteúdo rico e atualizações. |
| **Devocional Diário** | `https://biblia.com/devocional` | 0.8 | Página de alto engajamento diário. |
| **Chat Teológico** | `https://biblia.com/chat` | 0.7 | Ferramenta interativa (IA). |
| **Busca** | `https://biblia.com/busca` | 0.5 | Utilitário (geralmente não indexado, mas acessível). |
| **Política de Privacidade** | `https://biblia.com/privacidade` | 0.3 | Obrigatório para conformidade. |
| **Termos de Uso** | `https://biblia.com/termos` | 0.3 | Obrigatório para conformidade. |

---

## 2. Estrutura do Blog (Dinâmica)
O Blog segue uma estrutura hierárquica clara para SEO: `Home > Categoria > Artigo`.

### 2.1 Categorias
URLs baseadas no `slug` definido no Painel Admin. Listagem atual baseada no seu banco de dados:

| Categoria | URL Real | Status |
| :--- | :--- | :--- |
| **Versículos por Temas** | `https://biblia.com/versiculos` | ✅ Ativa |
| **Histórias** | `https://biblia.com/historias` | ✅ Ativa |
| **Dúvidas** | `https://biblia.com/duvidas` | ✅ Ativa |
| **Orações** | `https://biblia.com/oracoes` | ✅ Ativa |
| **Amor e Relacionamento** | `https://biblia.com/amor-e-relacionamento` | ✅ Ativa |
| **Ensinamentos** | `https://biblia.com/ensinamentos` | ✅ Ativa |
| **Recursos** | `https://biblia.com/recursos-para-compartilhar` | ✅ Ativa |

### 2.2 Artigos (Blog Posts)
Exemplos de artigos já existentes no sistema. A URL canônica inclui a categoria para reforçar o contexto semântico.

*   `https://biblia.com/historias/quem-foi-jonas-na-biblia`
*   `https://biblia.com/historias/13-grandes-homens-da-biblia-que-fizeram-a-diferenca`
*   `https://biblia.com/historias/quem-foi-mateus-para-jesus`
*   `https://biblia.com/historias/infancia-de-jesus-cristo`
*   `https://biblia.com/historias/quem-foi-paulo-linha-do-tempo-da-vida-do-apostolo`
*   `https://biblia.com/historias/quem-foi-tiago-na-biblia-impacto-e-influencia-no-novo-testamento`
*   `https://biblia.com/versiculos/versiculos-poderosos-para-vencer-a-tristeza-e-o-desanimo`
*   `https://biblia.com/versiculos/versiculos-sobre-problemas-financeiros-paz-e-solucao`

*(E assim por diante para todos os arquivos `.json` na pasta `blog_posts`)*

---

## 3. Bíblia Online (O Grande Volume)
Esta seção contém o maior volume de páginas (1.189 capítulos). A estrutura é previsível e altamente indexável.

**Padrão de URL:** `https://biblia.com/leitura/{livro}/{capitulo}`

### Antigo Testamento
*   **Gênesis**: `https://biblia.com/leitura/genesis/1` até `/50`
*   **Êxodo**: `https://biblia.com/leitura/exodo/1` até `/40`
*   **Salmos**: `https://biblia.com/leitura/salmos/1` até `/150`
*   *(Lista completa de 39 livros)*

### Novo Testamento
*   **Mateus**: `https://biblia.com/leitura/mateus/1` até `/28`
*   **João**: `https://biblia.com/leitura/joao/1` até `/21`
*   **Apocalipse**: `https://biblia.com/leitura/apocalipse/1` até `/22`
*   *(Lista completa de 27 livros)*

---

## 4. Implementação Técnica Recomendada

Para garantir que o Google descubra todos esses links, recomendo a implementação de um **Sitemap Dinâmico (`/sitemap.xml`)**.

Como seu site roda em um servidor Node.js customizado, podemos criar uma rota que gera este XML automaticamente, sempre atualizado.

### Estrutura do XML Proposto:

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <!-- Static -->
   <url>
      <loc>https://biblia.com/</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
   </url>
   
   <!-- Categories (Loop automático) -->
   <url>
      <loc>https://biblia.com/historias</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
   </url>

   <!-- Posts (Loop automático) -->
   <url>
      <loc>https://biblia.com/historias/quem-foi-jonas-na-biblia</loc>
      <lastmod>2025-12-04</lastmod>
      <priority>0.8</priority>
   </url>
   
   <!-- Bible (Gerado via Constantes) -->
   <url>
      <loc>https://biblia.com/leitura/genesis/1</loc>
      <priority>0.6</priority>
   </url>
   ...
</urlset>
```

## Próximo Passo
Gostaria que eu implementasse a rota `/sitemap.xml` no seu servidor agora? Isso deixará seu sitemap pronto e automático para sempre.
