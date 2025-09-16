import { toast } from "sonner";

export const copyLink = (workflowId: string, firstInterviewId: string, setCopied: any, pathname: string) => {
    const linkToCopy =
        (window.location.host?.includes("localhost") ? "http:" : "https:") +
        "//" +
        window.location.host +
        `/workflows/${workflowId}/join-interview/${firstInterviewId}`;
    navigator.clipboard
        .writeText(linkToCopy)
        .then(() => {
            toast.success(`Selected Interview was link copied`);
            pathname.includes("all-interviews") ? setCopied(firstInterviewId) : setCopied(workflowId);
            setTimeout(() => {
                setCopied("");
            }, 2000);
        })
        .catch(() => {
            toast.error("Failed to copy the link. Please try again.");
        });
};