import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import { GiReturnArrow } from "react-icons/gi";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWhatsapp,
  faFacebook,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faGlobeAmericas } from "@fortawesome/free-solid-svg-icons";
import "./ChatBot.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [useUnaApi, setUseUnaApi] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("");
  const [placeholder, setPlaceholder] = useState("اكتب سؤالك هنا..."); // نص placeholder

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Set the document title
    document.title = "OIC BOT";

    // Get today's date in Arabic format
    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    setCurrentDate(formattedDate);
  }, []);

  const addLinkTargetAttribute = (html) => {
    return html.replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" '
    );
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    const apiUrl = useUnaApi
      ? "https://oicchatbot.onrender.com/ask_una/"
      : "https://oicchatbot.onrender.com/ask_questions/";

    try {
      console.log("Sending request to:", apiUrl);
      console.log("Payload:", { question: input });

      const response = await axios.post(apiUrl, { question: input });
      console.log("Response Data:", response.data);

      const updatedMessages = [...newMessages];

      if (useUnaApi) {
        // Handle UNA API response
        if (response.data.answer && response.data.answer.length > 0) {
          response.data.answer.forEach((answer) => {
            if (answer.search_url) {
              // Render a button for the search URL
              updatedMessages.push({
                text: `
                  <div style="text-align: center;">
                    <a href="${answer.search_url}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       style="
                          background-color: #0a4c5a; 
                          color: white; 
                          padding: 8px 16px; 
                          text-decoration: none; 
                          border-radius: 20px; 
                          font-weight: bold; 
                          display: inline-block; 
                          margin-top: 10px; 
                          text-align: center;">
                       للإطلاع على المزيد من الأخبار إضغط هنا
                    </a>
                  </div>
                `,
                sender: "bot",
                icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
                isHtml: true,
              });
            } else {
              // Render individual answer content
              const imageHtml = answer.image_url
                ? `<img src="${answer.image_url}" alt="Image" style="width: 100%; height: auto; margin-top: 10px; border-radius: 10px;">`
                : "";

              updatedMessages.push({
                text: `
                  <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    ${imageHtml}
                    <p style="color: #666; font-size: 12px; margin-top: 10px; text-align: center;">${answer.date}</p>
                    <h3 style="font-size: 18px; color: #333; margin-top: 10px;">${answer.title}</h3>
                    <p style="color: #555; font-size: 14px; line-height: 1.6; margin-top: 10px;">${answer.content}</p>
                    <a href="${answer.link}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       style="
                          background-color: #0a4c5a; 
                          color: white; 
                          padding: 8px 16px; 
                          text-decoration: none; 
                          border-radius: 20px; 
                          font-weight: bold; 
                          display: inline-block; 
                          margin-top: 10px; 
                          text-align: center;">
                      أكمل القراءة
                    </a>
                  </div>
                `,
                sender: "bot",
                icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
                isHtml: true,
              });
            }
          });
        } else {
          updatedMessages.push({
            text: "آسف، لم أتمكن من العثور على إجابة.",
            sender: "bot",
            icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
          });
        }
      } else {
        // Handle `ask_questions` API response
        if (response.data.answer_type === "multiple") {
          // Process 'multiple' answers
          const answerText = response.data.answer;
          const lines = answerText.split("\n");
          const collapsibleItems = [];
          let currentTitle = "";

          lines.forEach((line) => {
            if (line.startsWith("-")) {
              currentTitle = line; // Keep raw HTML for the title
              collapsibleItems.push({
                title: currentTitle,
                description: "",
                isExpanded: false,
              });
            } else if (currentTitle) {
              collapsibleItems[collapsibleItems.length - 1].description += line; // Keep raw HTML for the description
            }
          });

          updatedMessages.push({
            sender: "bot",
            collapsibleItems,
            type: "multipleAnswers",
          });
        } else if (response.data.answer) {
          updatedMessages.push({
            text: addLinkTargetAttribute(response.data.answer),
            sender: "bot",
            icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
            isHtml: true,
          });
        } else {
          updatedMessages.push({
            text: "آسف، لم أتمكن من العثور على الإجابة.",
            sender: "bot",
            icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
          });
        }
      }

      setMessages(updatedMessages);
    } catch (error) {
      console.error("Error sending message:", error.response || error.message);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        },
      ]);
    }
  };

  const toggleItem = (messageIndex, itemIndex) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg, msgIdx) => {
          if (msgIdx === messageIndex && msg.type === "multipleAnswers") {
            return {
              ...msg,
              collapsibleItems: msg.collapsibleItems.map((item, idx) =>
                idx === itemIndex
                  ? { ...item, isExpanded: !item.isExpanded }
                  : item
              ),
            };
          }
          return msg;
        })
      );
    };


  const handleSimilarQuestion = async (id) => {
    const similarQuestion = messages.find((msg) => msg.id === id);
    if (!similarQuestion) return;

    try {
      const response = await axios.post(
        "https://oicchatbot.onrender.com/ask_questions/",
        {
          question: similarQuestion.text,
        }
      );

      const newMessages = [
        ...messages,
        { text: similarQuestion.text, sender: "user" },
      ];

      if (response.data && response.data.answer) {
        newMessages.push({
          text: response.data.answer,
          sender: "bot",
          icon: "https://i.postimg.cc/YSzf3QQx/chatbot-1.png",
          isHtml: true,
        });
      } else {
        newMessages.push({
          text: "عذرًا، لم أتمكن من العثور على إجابة لهذا السؤال.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        });
      }

      setMessages(newMessages);
    } catch (error) {
      console.error("حدث خطأ أثناء إرسال السؤال:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.",
          sender: "bot",
          icon: "https://i.postimg.cc/wB80F6Z9/chatbot.png",
        },
      ]);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      console.log("Voice recognition started. Speak into the microphone.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(new Event("submit"));
    };

    recognition.onerror = (event) => {
      console.error("Error occurred in recognition: " + event.error);
    };

    recognition.start();
  };

  const handleUnaClick = () => {
    setUseUnaApi(true); // استخدام API الخاص بـ يونا
    setPlaceholder("اسأل عن خبر من منصة يونا..."); // تغيير placeholder
  };

  const handleGeneralClick = () => {
    setUseUnaApi(false); // استخدام API الخاص بالأسئلة العامة
    setPlaceholder("ماذا تريد أن تعرف..."); // تغيير placeholder
  };

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <img src="/unalogo.png" alt="UNA Logo" className="una-logo" />
        <div className="current-date">{currentDate}</div>
      </div>
      {/* Chat messages container */}
      <div className="chat-container">
        <div className="chat-messages">
            {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                    <div className="message-text">
                        {msg.isHtml ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: msg.text,
                                }}
                            />
                        ) : msg.type === "multipleAnswers" ? (
                            msg.collapsibleItems.map((item, itemIndex) => (
                                <div key={itemIndex} className="collapsible-item">
                                    <button
                                        onClick={() => toggleItem(index, itemIndex)}
                                        className="collapsible-button"
                                    >
                                        {item.title}
                                    </button>
                                      {item.isExpanded && (
                                        <div
                                          className="collapsible-content"
                                          dangerouslySetInnerHTML={{ __html: item.description }}
                                        />
                                      )}
                                </div>
                            ))
                        ) : (
                            <TypeAnimation
                                sequence={[msg.text, () => {
                                }]}
                                speed={70}
                                repeat={0}
                                wrapper="div"
                            />
                        )}
                    </div>
                    {msg.sender === "bot" && msg.isButton && (
                        <button
                            onClick={() => handleSimilarQuestion(msg.id)}
                            className="similar-question-button"
                        >
                            <GiReturnArrow/> {msg.text}
                        </button>
                    )}
                </div>
            ))}
            <div ref={messagesEndRef}/>
        </div>
      </div>

        {/* Message input form */}
      <form onSubmit={sendMessage} className="chat-input-form">
        <div className="api-toggle-buttons-container">
          {/*<button*/}
          {/*  type="button"*/}
          {/*  onClick={handleGeneralClick}*/}
          {/*  className={`api-toggle-button ${!useUnaApi ? "active" : ""}`}*/}
          {/*>*/}
          {/*  أسئلة عامة*/}
          {/*</button>*/}
          {/*<button*/}
          {/*  type="button"*/}
          {/*  onClick={handleUnaClick}*/}
          {/*  className={`api-toggle-button ${useUnaApi ? "active" : ""}`}*/}
          {/*>*/}
          {/*  (OIC) أسئلة من منصة*/}
          {/*</button>*/}
        </div>
        <div className="form-question-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="chat-input"
          />
          <button type="submit" className="send-button">
            <FiSend />
          </button>
          <button
            type="button"
            onMouseDown={startListening}
            className="microphone-button"
          >
            <img
              src="../microphone.png"
              alt="ميكروفون"
              style={{
                width: "27px",
                height: "27px",
              }}
            />
          </button>
        </div>
      </form>

      {/* Buttons for switching question types */}

      {/* Robot animation */}
      <img src="../rob.png" alt="" className="robot-container" />

      {/* Footer */}
      <div className="footer">
        <p>
          © حقوق الطبع والنشر 2024{" "}
          <a
            href="https://www.oic-oci.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "blue" }}
          >
            OIC.OIC.ORG
          </a>{" "}
          جميع الحقوق محفوظة لصالح
        </p>
        <div className="social-icons">
          <a
            href="https://whatsapp.com/channel/0029Va9VuuE1XquahZEY5S1S"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faWhatsapp} />
          </a>
          <a
            href="https://www.facebook.com/oicinenglish/?locale=ar_AR"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faFacebook} />
          </a>
          <a
            href="https://una-oic.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGlobeAmericas} />
          </a>
          <a
            href="https://x.com/OIC_OCI?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faTwitter} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
