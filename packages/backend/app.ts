import express, { Express, ErrorRequestHandler } from "express"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import morgan from "morgan"
import registerRoutes from "./src/routes"
import cors from "cors"

dotenv.config()
const app: Express = express()

const corsConfig: {} = {
  origin: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Features', 'Accept'],
  preflightContinue: true,
  credentials: true
}

app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"))
app.use(cors(corsConfig))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
// Register routes on app
registerRoutes(app)

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.send("Default Error Handler")
})

// export server
export default app