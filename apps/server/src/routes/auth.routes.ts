import { Router } from "express";
import { signinSchema, signupSchema } from "../types/auth.schema.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { credentialLimiter } from "../middleware/rate-limit.middleware.js";
import {
  githubCallbackHandler,
  githubStartHandler,
  meHandler,
  signinHandler,
  signoutHandler,
  signupHandler,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", credentialLimiter, validate(signupSchema), signupHandler);
router.post("/signin", credentialLimiter, validate(signinSchema), signinHandler);
router.post("/signout", signoutHandler);
router.get("/me", requireAuth, meHandler);

router.get("/github", credentialLimiter, githubStartHandler);
router.get("/github/callback", githubCallbackHandler);

export default router;
