"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import styles from "./ListenButton.module.scss";

function findPortugueseVoice(): SpeechSynthesisVoice | undefined {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang === "pt-BR") ?? voices.find((voice) => voice.lang.startsWith("pt"));
}

interface ListenButtonProps {
    text: string;
}

// reads a plain language summary of the page, hidden when the device has no portuguese voice
export function ListenButton({ text }: Readonly<ListenButtonProps>) {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(undefined);

    useEffect(() => {
        if (!("speechSynthesis" in window)) {
            return;
        }
        // voices load asynchronously in most browsers
        const updateVoice = () => setVoice(findPortugueseVoice());
        updateVoice();
        window.speechSynthesis.addEventListener("voiceschanged", updateVoice);
        return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoice);
    }, []);

    if (!voice) {
        return null;
    }

    function speak() {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.voice = voice ?? null;
        window.speechSynthesis.speak(utterance);
    }

    return (
        <button type="button" className={styles.button} onClick={speak}>
            <Volume2 aria-hidden="true" />
            Ouvir
        </button>
    );
}