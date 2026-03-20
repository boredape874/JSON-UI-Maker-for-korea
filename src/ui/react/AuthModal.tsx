import { FormEvent, useEffect, useState } from "react";
import { authManager } from "../../auth.js";
import { closeAuthModalBridge, subscribeAuthModalBridge } from "./authModalBridge.js";

type MessageState = {
    type: "success" | "error";
    text: string;
} | null;

export function AuthModal() {
    const [open, setOpen] = useState(false);
    const [signupMode, setSignupMode] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<MessageState>(null);

    useEffect(() => subscribeAuthModalBridge((event) => {
        if (event.type === "open-auth-modal") {
            setSignupMode(event.signup);
            setUsername("");
            setPassword("");
            setMessage(null);
            setOpen(true);
        }

        if (event.type === "close-auth-modal") {
            setOpen(false);
        }
    }), []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const result = signupMode
            ? await authManager.signup(username, password)
            : await authManager.signin(username, password);

        if (!result.success) {
            setMessage({ type: "error", text: result.message });
            return;
        }

        setMessage({ type: "success", text: result.message });
        window.setTimeout(() => {
            setOpen(false);
            setMessage(null);
        }, 1000);
    };

    return (
        <div id="modalAuth" className="modal" style={{ display: open ? "block" : "none" }} onClick={(event) => {
            if (event.target === event.currentTarget) {
                closeAuthModalBridge();
            }
        }}>
            <div className="modal-content" style={{ maxWidth: 400 }}>
                <span id="modalAuthClose" className="modalClose" style={{ cursor: "pointer" }} onClick={() => closeAuthModalBridge()}>&times;</span>
                <h2 className="modalHeader" id="authModalTitle">{signupMode ? "Sign Up" : "Sign In"}</h2>
                <div className="modalAuthForm">
                    <form id="authForm" onSubmit={handleSubmit}>
                        <div className="auth-form-group">
                            <label htmlFor="authUsername">Username:</label>
                            <input type="text" id="authUsername" name="username" required minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} />
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="authPassword">Password:</label>
                            <input type="password" id="authPassword" name="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
                        </div>

                        <div className="auth-form-buttons">
                            <button type="submit" id="authSubmitBtn">{signupMode ? "Sign Up" : "Sign In"}</button>
                            <button
                                type="button"
                                id="authToggleBtn"
                                onClick={() => {
                                    setSignupMode((value) => !value);
                                    setMessage(null);
                                    setPassword("");
                                }}
                            >
                                {signupMode ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                            </button>
                        </div>
                    </form>

                    <div id="authMessage" className={`auth-message${message ? ` ${message.type}` : ""}`} style={{ display: message ? "block" : "none" }}>
                        {message?.text}
                    </div>
                </div>
            </div>
        </div>
    );
}
