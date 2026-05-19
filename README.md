# WeLikeChess — Frontend

Frontend de la plataforma de ajedrez online WeLikeChess, desarrollado como Trabajo de Fin de Grado.

## Stack

- **Next.js 16** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS v4** (via PostCSS)
- **framer-motion** — animaciones
- **chess.js** + **react-chessboard** — lógica y tablero de ajedrez
- **lucide-react** — iconos

## Comandos

| Comando         | Acción                              |
| :-------------- | :---------------------------------- |
| `npm install`   | Instala las dependencias            |
| `npm run dev`   | Inicia el servidor en `localhost:3000` |
| `npm run build` | Genera la build de producción       |
| `npm run start` | Inicia el servidor de producción    |
| `npm run lint`  | Ejecuta el linter                   |

## Estructura

```
src/
├── app/          # Rutas (Next.js App Router)
├── components/   # Componentes React
│   ├── auth/
│   ├── context/
│   ├── game/
│   ├── history/
│   ├── layout/
│   ├── modals/
│   ├── profile/
│   ├── ranking/
│   ├── settings/
│   ├── ui/
│   ├── utils/
│   └── views/
├── hooks/        # Custom hooks
├── styles/       # CSS global y del tablero
└── types/        # Tipos TypeScript compartidos
```
