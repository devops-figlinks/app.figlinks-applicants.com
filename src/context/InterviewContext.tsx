"use client";
import { createContext, ReactNode, useContext, useState } from "react";
import { generateQuestionsAPI } from "@/https/services/interviews";
import { Message, SelectedMessage } from "@/lib/interfaces/interviews";
import { usePathname, useRouter } from "next/navigation";

interface InterviewContextType {
    loading: boolean;
    getInterviewQuestions: (prompt?: string) => void;
    todayTime: string;
    input: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setInterviewQuestionsType: React.Dispatch<React.SetStateAction<string>>;
    setMcqPhase: React.Dispatch<React.SetStateAction<string>>;
    setPhase: React.Dispatch<React.SetStateAction<string>>;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    inteviewQuestionsType: string;
    mcqPhase: string;
    phase: string;
    selectedMessages: SelectedMessage[];
    setSelectedMessages: React.Dispatch<React.SetStateAction<SelectedMessage[]>>;
    promptGenerated: boolean;
    setPromptGenerated: React.Dispatch<React.SetStateAction<boolean>>;
    interviewType: string;
    setInterviewType: React.Dispatch<React.SetStateAction<string>>;
    copiedWorkflowId: string;
    setCopiedWorkflowId: React.Dispatch<React.SetStateAction<string>>;
    copiedInterviewDetails : any;
    setCopiedInterviewDetails: React.Dispatch<React.SetStateAction<string>>;

}

const InterviewContext = createContext<InterviewContextType>({
    loading: false,
    getInterviewQuestions: () => { },
    todayTime: "",
    input: "",
    messages: [],
    setMessages: () => { },
    setInterviewQuestionsType: () => { },
    setMcqPhase: () => { },
    setPhase: () => { },
    setInput: () => { },
    setLoading: () => { },
    inteviewQuestionsType: "QNA",
    mcqPhase: "",
    phase: "phase1",
    selectedMessages: [],
    setSelectedMessages: () => { },
    promptGenerated: false,
    setPromptGenerated: () => { },
    interviewType: "",
    setInterviewType: () => { },
    copiedWorkflowId: "",
    setCopiedWorkflowId: () => { },
    copiedInterviewDetails : {},
    setCopiedInterviewDetails: () => { },

});

interface InterviewProviderProps {
    children: ReactNode;
}

export const useInterviewContext = () => useContext(InterviewContext);
export const InterviewProvider = ({ children }: InterviewProviderProps) => {
    const pathname = usePathname();
    const [todayTime, setTodayTime] = useState("");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [inteviewQuestionsType, setInterviewQuestionsType] = useState<string>("QNA");
    const [mcqPhase, setMcqPhase] = useState<string>("");
    const [phase, setPhase] = useState("phase1");
    const [interviewType, setInterviewType] = useState("");
    const [selectedMessages, setSelectedMessages] = useState<SelectedMessage[]>(
        []);
    const router = useRouter();
    const [promptGenerated, setPromptGenerated] = useState<boolean>(false);
    const [copiedWorkflowId, setCopiedWorkflowId] = useState("");
    const [copiedInterviewDetails, setCopiedInterviewDetails] = useState({});

    const getTodayTime = () => {
        const time = new Date();
        setTodayTime(
            time.toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
            })
        );
    };

    const getInterviewQuestions = async (prompt?: string) => {
        getTodayTime();
        const newMessage: Message = {
            id: `${Date.now()}`,
            prompt: prompt || input,
            questionsAndAnswers: [],
        };
        setMessages((prev) => [...prev, newMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await generateQuestionsAPI({
                payload: {
                    prompt_topic: (prompt || input),
                    interview_qb_type: inteviewQuestionsType
                },
            });

            const data = response.data?.data;
            setPromptGenerated(true);
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === newMessage.id
                        ? { ...msg, questionsAndAnswers: data || [] }
                        : msg
                )
            );
            if (inteviewQuestionsType === "MCQ") {
                setMcqPhase("phase1");
                router.replace('/interviews/mcqPhase1');
            }
            if (pathname.includes('/mcqPhase1') && inteviewQuestionsType === "QNA") {
                router.replace('/interviews/createinterview');
            }
        } catch (error) {
            console.error("Error fetching interview questions:", error);
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === newMessage.id
                        ? {
                            ...msg,
                            questionsAndAnswers: [
                                {
                                    question: "Generic Error. Please try another prompt.",
                                    answer: false,
                                },
                            ],
                        }
                        : msg
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <InterviewContext.Provider
            value={{
                getInterviewQuestions,
                todayTime,
                input,
                setInput,
                messages,
                setMessages,
                loading,
                setLoading,
                mcqPhase,
                setMcqPhase,
                inteviewQuestionsType,
                setInterviewQuestionsType,
                setPhase,
                phase,
                selectedMessages,
                setSelectedMessages,
                promptGenerated,
                setPromptGenerated,
                interviewType,
                setInterviewType,
                copiedWorkflowId,             
                setCopiedWorkflowId,
                copiedInterviewDetails,
                setCopiedInterviewDetails 
            }}
        >
            {children}
        </InterviewContext.Provider>
    );
};