import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { signinSchema, signupSchema } from "../types/auth.schema.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  meHandler,
  signinHandler,
  signoutHandler,
  signupHandler,
} from "../controllers/auth.controller.js";

const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const router = Router();

router.post("/signup", credentialLimiter, validate(signupSchema), signupHandler);
router.post("/signin", credentialLimiter, validate(signinSchema), signinHandler);
router.post("/signout", signoutHandler);
router.get("/me", requireAuth, meHandler);

export default router;
