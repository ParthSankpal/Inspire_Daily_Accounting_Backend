import express from 'express';
import { signup, signin, googleSignIn, signout } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);       // For superadmin account creation
router.post('/signin', signin);       // For superadmin login
router.post('/google-signin', googleSignIn);  // Optional: For Google OAuth if needed
router.post('/signout', signout);     // For logging out

export default router;
