import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import io from "socket.io-client";

export default function DynamicSpace() {
    const router = useRouter();
    const { id } = router.query;

    const socketRef = useRef(null);

    const [space, setSpace] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");
    const [currentUserName, setCurrentUserName] = useState("");
    const [onlineUsers, setOnlineUsers] = useState({});

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");


    const quizzes = space?.quizzes || [];

    const [showQuizDropdown, setShowQuizDropdown] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [completedQuizzes, setCompletedQuizzes] = useState([])

    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const bottomRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [announcements, setAnnouncements] = useState([]);
    const [annInput, setAnnInput] = useState("");
    const [searchChat, setSearchChat] = useState("");

    const isLeader = space?.leader === currentUserEmail;

    const getYouTubeEmbedUrl = (url) => {
        try {
            const parsed = new URL(url);

            if (parsed.hostname.includes("youtu.be")) {
                return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
            }

            if (parsed.hostname.includes("youtube.com")) {
                const id = parsed.searchParams.get("v");
                if (id) {
                    return `https://www.youtube.com/embed/${id}`;
                }
            }

            return null;
        } catch {
            return null;
        }
    };
    const handleReaction = async (messageId, reactionType) => {
        try {
            const res = await fetch("/api/reactToMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageId,
                    reactorEmail: currentUserEmail,
                    reactionType,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId
                            ? { ...msg, reactions: data.reactions }
                            : msg
                    )
                );
            }
        } catch (err) {
            console.error("Reaction failed:", err);
        }
    };

    const getTimeRemaining = (lastRotation) => {
        if (!lastRotation) return "Starting soon";

        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        const endTime = lastRotation + ONE_WEEK;

        const diff = endTime - Date.now();

        if (diff <= 0) return "Rotating soon";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );

        return `${days}d ${hours}h remaining`;
    };





    // Format time
    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages.length]);


    // Load current user
    useEffect(() => {
        setCurrentUserEmail(localStorage.getItem("userEmail"));
        setCurrentUserName(localStorage.getItem("userName"));
    }, []);

    //Load completed quizzes
    useEffect(() => {

        if (!currentUserEmail) return;

        fetch(`/api/getQuizAttempts?email=${currentUserEmail}`)
            .then(res => res.json())
            .then(data => {
                setCompletedQuizzes(data.quizIds || []);
            });

    }, [currentUserEmail]);

    useEffect(() => {
        if (!router.isReady || !id) return;

        fetch(`"/api/rotateLeader"?spaceId=${id}`, { method: "POST" });

        fetch(`/api/getSpace?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.space) {
                    setSpace(data.space);
                } else {
                    console.error("Space not found:", data);
                }
            })
            .catch((err) => console.error("Fetch error:", err));
    }, [router.isReady, id]);



    // Load discussion messages
    useEffect(() => {
        if (!id) return;

        fetch(`/api/getSpaceMessages?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages || []));
    }, [id]);

    // Load announcements
    useEffect(() => {
        if (!id) return;

        fetch(`/api/getAnnouncements?spaceId=${id}`)
            .then((res) => res.json())
            .then((data) => setAnnouncements(data.announcements || []));
    }, [id]);

    // SOCKET.IO CONNECTION
    useEffect(() => {
        if (!space || !currentUserEmail) return;

        if (!socketRef.current) {
            const SOCKET_URL =
                process.env.NODE_ENV === "development"
                    ? "http://localhost:4000"
                    : "https://socket-server-cyma.onrender.com";

            socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
        }

        const socket = socketRef.current;

        // Join room for this space
        socket.emit("join-space", id);

        // Mark user online
        socket.emit("user-online", currentUserEmail);

        // Track online users
        socket.on("online-users", (data) => {
            setOnlineUsers(data);
        });

        // Receive discussion message
        const handleMsg = (data) => {
            if (data.sender === currentUserEmail) return;
            setMessages((prev) => [...prev, data]);
        };

        socket.on("space-message", handleMsg);

        // Receive announcement
        const handleAnnouncement = (data) => {
            setAnnouncements((prev) => [...prev, data]);
        };

        socket.on("announcement", handleAnnouncement);

        return () => {
            socket.off("space-message", handleMsg);
            socket.off("announcement", handleAnnouncement);
            socket.off("online-users");
        };
    }, [space, currentUserEmail]);

    // SEND DISCUSSION MESSAGE
    const detectMessageType = (text) => {
        if (!text.startsWith("http")) return "text";

        const lower = text.toLowerCase();

        if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
            return "youtube";
        }

        if (
            lower.endsWith(".png") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".gif") ||
            lower.endsWith(".webp")
        ) {
            return "image";
        }

        return "link";
    };

    const sendMessage = async () => {
        if (!chatInput.trim()) return;

        const msg = {
            spaceId: id,
            spaceName: space.title,
            sender: currentUserEmail,
            name: currentUserName,
            type: detectMessageType(chatInput.trim()),
            content: chatInput.trim(),
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, msg]);

        await fetch("/api/saveSpaceMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });


        socketRef.current.emit("space-message", msg);

        setChatInput("");
    };

    const sendAudioMessage = (audioUrl) => {

        const msg = {
            spaceId: id,
            spaceName: space.title,
            sender: currentUserEmail,
            name: currentUserName,
            type: "audio",
            content: audioUrl,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, msg]);

        socketRef.current.emit("space-message", msg);
    };


    // Handling File Uploads
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("spaceId", id);
        formData.append("sender", currentUserEmail);
        formData.append("name", currentUserName);

        const res = await fetch("/api/uploadFile", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (data.success) {
            setMessages((prev) => [...prev, data.message]);
        } else {
            alert(data.error || "Upload failed");
        }
    };

    const startRecording = async () => {

        console.log("Recording started");
        try {

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorder = new MediaRecorder(stream);

            const chunks = [];

            recorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            recorder.onstop = async () => {

                const audioBlob = new Blob(chunks, { type: "audio/webm" });

                const formData = new FormData();

                formData.append("audio", audioBlob, "recording.webm");

                const upload = await fetch("/api/uploadAudio", {
                    method: "POST",
                    body: formData
                });

                const data = await upload.json();

                console.log(data);

                if (data.audioUrl) {
                    sendAudioMessage(data.audioUrl);
                }

            };

            recorder.start();

            setMediaRecorder(recorder);
            setRecording(true);
            setAudioChunks(chunks);

        } catch (err) {
            console.error("Recording error:", err);
        }
    };

    const stopRecording = () => {

        if (mediaRecorder) {
            mediaRecorder.stop();
        }

        setRecording(false);
    };

    const startSpeechToText = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported in this browser");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let transcript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            setChatInput(transcript);
        };

        recognition.onend = () => {
            setListening(false);
        };

        recognition.onerror = (e) => {
            console.error("Speech error:", e);
            setListening(false);
        };

        recognition.start();

        recognitionRef.current = recognition;
        setListening(true);
    };

    const stopSpeechToText = () => {
        recognitionRef.current?.stop();
        setListening(false);
    };


    // SEND ANNOUNCEMENT
    const sendAnnouncement = async () => {
        if (!annInput.trim()) return;

        const announcement = {
            spaceId: id,
            sender: currentUserEmail,
            text: annInput,
            timestamp: Date.now(),
        };

        setAnnouncements((prev) => [...prev, announcement]);
        socketRef.current.emit("announcement", announcement);

        setAnnInput("");
    };

    // Exit space
    const leave = () => router.push("/dashboard");
    function CreateQuizForm({ spaceId, userEmail, onCreated }) {
        const [title, setTitle] = useState("");
        const [question, setQuestion] = useState("");
        const [options, setOptions] = useState(["", "", "", ""]);
        const [answer, setAnswer] = useState(0);
        const [questions, setQuestions] = useState([]);

        const addQuestion = () => {
            if (!question.trim()) return;

            setQuestions([
                ...questions,
                { question, options, answer: Number(answer) },
            ]);

            setQuestion("");
            setOptions(["", "", "", ""]);
        };

        const saveQuiz = async () => {
            let finalQuestions = [...questions];

            // If user typed a question but didn’t click Add Question yet
            if (question.trim()) {
                finalQuestions.push({
                    question,
                    options,
                    answer: Number(answer),
                });
            }

            if (!title) {
                alert("Please enter a title");
                return;
            }

            if (finalQuestions.length === 0) {
                alert("Add at least one question");
                return;
            }

            try {
                const res = await fetch("/api/createQuiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        spaceId,
                        title,
                        questions: finalQuestions,
                        createdBy: userEmail,
                    }),
                });

                const data = await res.json();
                console.log(data);

                if (!res.ok) {
                    alert(data.error || "Failed to save quiz");
                    return;
                }

                alert("Quiz saved!");
                onCreated();
            } catch (err) {
                console.error(err);
                alert("Server error");
            }
        };
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5 mt-6 border border-gray-100">


                <h3 className="text-2xl font-semibold text-purple-700 flex items-center gap-2">
                    📝 Create Quiz
                </h3>


                <div>
                    <label className="text-sm text-gray-500">Quiz Title</label>
                    <input
                        className="w-full mt-1 border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Enter quiz title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>


                <div>
                    <label className="text-sm text-gray-500">Question</label>
                    <input
                        className="w-full mt-1 border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Enter your question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {options.map((opt, i) => (
                        <input
                            key={i}
                            className="border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                                const copy = [...options];
                                copy[i] = e.target.value;
                                setOptions(copy);
                            }}
                        />
                    ))}
                </div>

                <div>
                    <label className="text-sm text-gray-500">Correct Answer</label>
                    <select
                        className="w-full mt-1 border border-gray-200 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                    </select>
                </div>


                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={addQuestion}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition"
                    >
                        ➕ Add Question
                    </button>

                    <button
                        type="button"
                        onClick={saveQuiz}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition"
                    >
                        💾 Save Quiz
                    </button>
                </div>

            </div>
        );
    }

    function QuizPlayer({ quiz, onBack }) {
        const [index, setIndex] = useState(0);
        const [score, setScore] = useState(0);
        const [selected, setSelected] = useState(null);
        const [showResult, setShowResult] = useState(false);

        const current = quiz.questions[index];

        return (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl shadow-2xl p-10 w-full h-full flex flex-col justify-center">
                <h2 className="text-xl mb-4">{quiz.title}</h2>

                <p className="text-sm text-purple-200 mb-5">
                    Question {index + 1} of {quiz.questions.length}
                </p>
                <p className="mb-4">{current.question}</p>

                {current.options.map((opt, i) => {

                    let buttonColor = "bg-white text-purple-700";

                    if (showResult) {
                        if (i === current.answer) {
                            buttonColor = "bg-green-500 text-white";
                        } else if (i === selected) {
                            buttonColor = "bg-red-500 text-white";
                        }
                    }

                    return (
                        <button
                            key={i}
                            disabled={showResult}
                            onClick={() => {

                                setSelected(i);
                                setShowResult(true);

                                let finalScore = score;

                                if (i === current.answer) {
                                    finalScore = score + 10;
                                    setScore(prev => prev + 10);
                                }

                                setTimeout(async () => {

                                    setSelected(null);
                                    setShowResult(false);

                                    if (index + 1 < quiz.questions.length) {
                                        setIndex(prev => prev + 1);
                                    } else {
                                        const res = await fetch("/api/addQuizPoints", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                email: localStorage.getItem("userEmail"),
                                                points: finalScore,
                                                quizId: quiz._id,
                                                spaceId: quiz.spaceId
                                            })
                                        });

                                        const data = await res.json();

                                        if (!res.ok) {
                                            alert(data.error);
                                            onBack();
                                            return;
                                        }

                                        await fetch("/api/saveAnnouncement", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                spaceId: id,
                                                sender: currentUserEmail,
                                                senderName: currentUserName,
                                                text: `🏆 ${currentUserName} scored ${finalScore} pts in "${quiz.title}"`,
                                                level: "quiz",
                                                timestamp: Date.now()
                                            })
                                        });
                                        router.reload();


                                        alert(`Quiz finished! Score: ${finalScore}`);
                                        onBack();
                                    }

                                }, 1500);

                            }}
                            className={`block w-full px-4 py-2 rounded mb-2 transition ${buttonColor}`}
                        >
                            {opt}
                        </button>
                    );
                })}

                <button onClick={onBack} className="mt-4 underline">
                    Back
                </button>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Loading space...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">

            {/* LEFT SIDEBAR — MEMBERS */}
            <aside className="w-full lg:w-64 bg-white lg:border-r shadow-sm p-5 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Members
                </h2>

                {space.members.map((m, i) => {
                    const isYou = m.email === currentUserEmail;

                    return (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 mb-2"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>

                                    <span
                                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${onlineUsers[m.email] ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    ></span>
                                </div>

                                <div>
                                    <p className="font-medium text-sm">{isYou ? "You" : m.name}</p>
                                    <p className="text-xs text-gray-500">{m.email}</p>
                                </div>
                            </div>

                            {!isYou && (
                                <Link
                                    href={`/dm/${encodeURIComponent(m.email)}?name=${encodeURIComponent(m.name)}`}
                                    className="text-purple-600 text-xs font-semibold hover:underline"
                                >
                                    DM
                                </Link>
                            )}
                        </div>
                    );
                })}
            </aside>

            {/* MAIN CONTENT — DISCUSSION */}
            <main className="flex-1 flex flex-col p-4 md:p-8 gap-6 overflow-y-auto">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-3">
                        <span className="text-3xl">{space.icon}</span>
                        {space.title}
                    </h1>

                    <p className="text-2xl text-purple-600 mt-2">
                        👑 Leader: {
                            space.members.find(m => m.email === space.leader)?.name || "None"
                        }
                    </p>
                    <p className="text-lg text-gray-500 mt-1">
                        ⏳ {getTimeRemaining(space.lastRotation)}
                    </p>


                    <div className="flex gap-4 mt-6">

                        {/* Discussion Button */}
                        <button
                            onClick={() => setSelectedQuiz(null)}
                            className="px-5 py-2 rounded-lg bg-purple-600 text-white"
                        >
                            Discussion
                        </button>

                        {/* Quiz Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowQuizDropdown(!showQuizDropdown)}
                                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                            >
                                Quiz ▼
                            </button>

                            {showQuizDropdown && (
                                <div className="absolute left-0 mt-2 w-72 bg-white shadow-xl rounded-xl z-50 p-3 space-y-2">

                                    {quizzes.length === 0 && (
                                        <p className="text-sm text-gray-500">No quizzes yet</p>
                                    )}

                                    {quizzes.map((quiz) => (
                                        <div
                                            key={quiz._id}
                                            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {

                                                if (isLeader) {
                                                    alert("As leader, you cannot answer quizzes this week");
                                                    return;
                                                }

                                                if (completedQuizzes.includes(quiz._id)) {
                                                    alert("You already completed this quiz");
                                                    return;
                                                }

                                                setSelectedQuiz(quiz);
                                                setShowQuizDropdown(false);
                                            }}
                                        >
                                            <p className="font-medium text-sm">{quiz.title}
                                                {completedQuizzes.includes(quiz._id) && " ✓"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Created by {quiz.createdBy}
                                            </p>
                                        </div>
                                    ))}

                                    <div className="border-t pt-2">
                                        <button
                                            onClick={() => {
                                                if (!isLeader) {
                                                    alert("Only the current leader can create quizzes this week");
                                                    return;
                                                }

                                                setSelectedQuiz("create");
                                                setShowQuizDropdown(false);
                                            }}
                                            className="w-full text-left text-green-600 text-sm font-medium"
                                        >
                                            + Create Quiz
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>

                    </div>

                    <p className="text-gray-600 mt-4">{space.desc}</p>

                    <p className="text-sm text-purple-700 flex justify-between mt-2">
                        👥 {space.members.length} Members
                        <button
                            onClick={leave}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                        >
                            Exit Space
                        </button>
                    </p>
                </div>

                {/* DISCUSSION BOX */}
                {selectedQuiz && selectedQuiz !== "create" && (
                    <QuizPlayer
                        quiz={selectedQuiz}
                        onBack={() => setSelectedQuiz(null)}
                    />
                )}

                {selectedQuiz === "create" && (
                    <CreateQuizForm
                        spaceId={space._id.toString()}
                        userEmail={currentUserEmail}
                        onCreated={() => router.reload()}
                    />
                )}

                {!selectedQuiz && (
                    <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col h-[70vh] md:h-[75vh]">
                        <h3 className="text-lg font-semibold mb-3">Discussion</h3>
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchChat}
                            onChange={(e) => setSearchChat(e.target.value)}
                            className="w-full mb-3 px- py-2 border rounded-lg text-sm outline-none"
                        />
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto space-y-3 pr-2"
                        >

                            {/* PINNED MESSAGES */}
                            {messages.some((msg) => msg.pinned) && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-yellow-700 mb-2">
                                        📌 Pinned Messages
                                    </h4>

                                    <div className="space-y-2">
                                        {messages
                                            .filter((msg) => msg.pinned)
                                            .map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-yellow-50 p-3 rounded-lg shadow-sm"
                                                >
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {msg.name}
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        {msg.content || msg.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {formatTime(msg.timestamp)}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/*  NORMAL MESSAGES */}
                            {messages
                                .filter((msg) => !msg.pinned)
                                .filter(
                                    (msg) =>
                                        msg.content
                                            ?.toLowerCase()
                                            .includes(searchChat.toLowerCase()) ||
                                        msg.name
                                            ?.toLowerCase()
                                            .includes(searchChat.toLowerCase())
                                )
                                .map((msg, i) => {
                                    const isMe = msg.sender === currentUserEmail;

                                    return (
                                        <div
                                            key={i}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`w-fit max-w-[85%] px-4 py-2 rounded-lg shadow-sm ${isMe
                                                    ? "bg-purple-600 text-white rounded-br-none"
                                                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                                                    }`}
                                            >
                                                {/* NAME */}
                                                <p className="text-xs font-semibold mb-1">
                                                    {isMe ? "You" : msg.name}
                                                </p>

                                                {/* MESSAGE TYPE HANDLING */}
                                                {msg.type === "file" ? (
                                                    <div className="bg-white text-gray-800 rounded-xl p-4 shadow-md w-full max-w-sm">
                                                        <p className="text-sm font-semibold">
                                                            {msg.originalName}
                                                        </p>
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-purple-600 text-sm underline"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                ) : msg.type === "youtube" ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(msg.content)}
                                                        className="w-full max-w-md aspect-video rounded"
                                                        allowFullScreen
                                                    />
                                                ) : msg.type === "image" ? (
                                                    <img
                                                        src={msg.content}
                                                        className="rounded-lg max-w-sm"
                                                    />
                                                ) : msg.type === "link" ? (
                                                    <a
                                                        href={msg.content}
                                                        target="_blank"
                                                        className="text-purple-600 underline"
                                                    >
                                                        {msg.content}
                                                    </a>
                                                ) : msg.type === "audio" ? (
                                                    <audio controls>
                                                        <source
                                                            src={msg.content}
                                                            type="audio/webm"
                                                        />
                                                    </audio>
                                                ) : (
                                                    <p>{msg.content || msg.message}</p>
                                                )}

                                                {/* TIME */}
                                                <p className="text-[10px] opacity-70 mt-1 text-right">
                                                    {formatTime(msg.timestamp)}
                                                </p>

                                                {/*  PIN BUTTON */}
                                                {isLeader && (
                                                    <button
                                                        onClick={async () => {
                                                            const res = await fetch(
                                                                "/api/pinMessage",
                                                                {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                    },
                                                                    body: JSON.stringify({
                                                                        messageId: msg._id,
                                                                    }),
                                                                }
                                                            );

                                                            const data = await res.json();

                                                            if (!res.ok) {
                                                                alert(
                                                                    data.error ||
                                                                    "Failed to pin message"
                                                                );
                                                                return;
                                                            }

                                                            router.reload();
                                                        }}
                                                        className="text-xs mt-2 text-yellow-600 hover:underline"
                                                    >
                                                        📌 Pin
                                                    </button>
                                                )}

                                                {/*  REACTIONS */}
                                                <div className="flex gap-3 mt-2 text-sm">
                                                    {["like", "clap", "fire"].map(
                                                        (type) => {
                                                            const count =
                                                                msg.reactions?.filter(
                                                                    (r) => r.type === type
                                                                ).length || 0;

                                                            const emojiMap = {
                                                                like: "👍",
                                                                clap: "👏",
                                                                fire: "🔥",
                                                            };

                                                            return (
                                                                <button
                                                                    key={type}
                                                                    onClick={() =>
                                                                        handleReaction(
                                                                            msg._id,
                                                                            type
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 hover:scale-110 transition"
                                                                >
                                                                    <span>
                                                                        {emojiMap[type]}
                                                                    </span>
                                                                    <span>{count}</span>
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                            <div ref={bottomRef}></div>
                        </div>



                        {/* DISCUSSION INPUT */}
                        <div className="mt-4 flex gap-3">

                            <input
                                type="file"
                                id="fileUpload"
                                hidden
                                onChange={handleFileUpload}
                            />

                            <button
                                onClick={() => document.getElementById("fileUpload").click()}
                                className="bg-purple-600 px-4 text-white py-2 rounded-lg"
                            >
                                📎Upload File
                            </button>

                            <button
                                onClick={recording ? stopRecording : startRecording}
                                className={`px-3 py-2 rounded-lg text-white ${recording ? "bg-red-600" : "bg-purple-600"
                                    }`}
                            >
                                {recording ? "⏹ Stop Recording" : "🎤 Record"}
                            </button>

                            <button
                                onClick={listening ? stopSpeechToText : startSpeechToText}
                                className={`px-3 py-2 rounded-lg text-white ${listening ? "bg-red-500" : "bg-blue-600"
                                    }`}
                            >
                                {listening ? "🛑 Stop Speech" : "🗣️ Speak"}
                            </button>


                            <input
                                className="flex-1 p-3 border rounded-lg"
                                placeholder="Type a message..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                )
                }
            </main >

            {/* RIGHT SIDEBAR — ANNOUNCEMENTS */}
            < aside className="w-full lg:w-80 bg-white lg:border-l shadow-sm p-5 overflow-y-auto" >
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Announcements
                </h2>

                <div className="flex gap-2 mb-4">
                    <input
                        className="flex-1 p-2 border rounded-lg"
                        placeholder="Post announcement..."
                        value={annInput}
                        onChange={(e) => setAnnInput(e.target.value)}
                    />
                    <button
                        onClick={sendAnnouncement}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                    >
                        Post
                    </button>
                </div>

                <div className="space-y-3">
                    {announcements.map((a, i) => (
                        <div
                            key={i}
                            className="relative bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded shadow-sm"
                        >
                            <span className="absolute -left-2 -top-2 text-xl">📍</span>
                            <p className="text-sm font-medium text-gray-800">{a.text}</p>
                            <p className="text-xs mt-1 text-gray-500">
                                {formatTime(a.timestamp)}
                            </p>
                        </div>
                    ))}
                </div>
            </aside >
        </div >
    );
}
