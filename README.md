## README

a JMAP webmail by vue3/typescript.

It was trying to implement a responsive layout/UI likes Outlook Web App. [screen capture video](https://youtu.be/jOY5z8KJYxw)

Now it's at an early stage with a few functions: login(auth), list mailboxes, list threads, read message.

## a full-functional webmail need to be implemented (development schedule)

0. ~~Prepare a demo-site (2022 May)~~ **Done. visit [Demo](https://bwh1.rubyfish.app/)**

1. Message Read (2022 Jun)
    * ~~threads UI~~ **Done.**
    * ~~email context menu: header viewer, full .eml download...~~ **Done.**
    * ~~attachment download~~ **Done.**
    * ~~html content filter & inline img~~ **Done.**
    * try put my patch into https://github.com/linagora/jmap-client-ts

2. Message Operation (2022 Jun)
    * create mailbox
    * move/delete mail
    * addressbook

3. Send Message (2022 Jul)
    * compose UI
    * reply/forward
    * connect submission service

4. Search & Tag (2022 Aug)
    * search UI
    * server-side sieve

5. Web Push & WebApp state (2022 Aug)

6. More..

## Howto build: Vue 3 + TypeScript + Vite

It's a vue3 project, and depends vite as the dev/build server.

vite.config.ts define the JMAP backend of your dev environment.

Optional: create .env.local with `VITE_DEFAULT_DOMAIN=yourdefaultdomain`. see [.env Files](https://vitejs.dev/guide/env-and-mode.html#env-files)

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's Take Over mode by following these steps:

1. Run `Extensions: Show Built-in Extensions` from VS Code's command palette, look for `TypeScript and JavaScript Language Features`, then right click and select `Disable (Workspace)`. By default, Take Over mode will enable itself if the default TypeScript extension is disabled.
2. Reload the VS Code window by running `Developer: Reload Window` from the command palette.

You can learn more about Take Over mode [here](https://github.com/johnsoncodehk/volar/discussions/471).
