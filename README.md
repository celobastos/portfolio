# MarceloOS — portfólio digital

Portfólio estático, responsivo e acessível de Marcelo Vinícius Bastos Santos. A aplicação combina uma interface inspirada em sistema operacional com uma edição web linear voltada a recrutadores. Não exige build nem dependências.

## Personalizar

Edite `dist/content.js` para atualizar perfil, experiência, competências e formação. O mesmo conteúdo alimenta os módulos do MarceloOS e a edição web 2026.

## Pré-visualizar

Em PowerShell:

```powershell
python -m http.server 4173 --directory dist
```

Abra `http://localhost:4173`.

## Estrutura

- `dist/index.html`: estrutura semântica das duas experiências
- `dist/styles.css`: identidade visual, responsividade e acessibilidade
- `dist/content.js`: conteúdo pessoal compartilhado
- `dist/app.js`: renderização, navegação e interações do MarceloOS
- `dist/assets/cv/`: currículos para download em francês e inglês

