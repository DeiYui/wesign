"use client";
import { colors } from "@/assets/colors";
import { CallIcon, MessageIcon } from "@/assets/icons";
import { SocketContext } from "@/hooks/useContext";
import Conversations from "@/model/Conversations";
import User from "@/model/User";
import { RootState } from "@/store";
import { chatAndCall } from "@/store/slices/chatSlice";
import { CloseOutlined, DoubleLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Spin, Typography } from "antd";
import { motion } from "framer-motion";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatInput from "./components/ChatInput";
import ContactButton from "./components/ContactButton";
import ContentMessage from "./components/ContentMessage";

const item = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1 },
};

const ChatWidget = () => {
  const dispatch = useDispatch();
  const user: User = useSelector((state: RootState) => state.admin);
  // trạng thái mơ chat
  const [chatOpen, setChatOpen] = useState(false);
  // danh sách tin nhắn
  const [messageList, setMessageList] = useState<any[]>([]);

  // files
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  //socket
  const {
    isLoading,
    socketResponse,
    sendData,
    sendTypingEvent,
    sendStopTypingEvent,
    isTyping,
    setIsTyping,
    // Call
    setName,
    selectedContact,
    setSelectedContact,
    socket,
  }: any = useContext(SocketContext);

  useEffect(() => {
    if (selectedContact.contactId && !chatOpen) {
      setChatOpen(true);
    }
  }, [selectedContact]);

  // API lấy danh sách hội thoại
  const { data: lstConversations } = useQuery({
    queryKey: ["getLstConversations"],
    queryFn: async () => {
      const res = await Conversations.getConversations();
      const flattenedArray: Contact[] = res?.data
        ?.flatMap((item: Conversation) =>
          item.grouAttachConvResList.map((val) => ({
            conversationId: item.conversationId,
            ...val,
          })),
        )
        ?.filter((e: Contact) => e.contactId !== user.userId);
      return flattenedArray;
    },
  });

  // API lấy message
  const { isFetching: isFetchingMessage } = useQuery({
    queryKey: ["getMessage", selectedContact.conversationId],
    queryFn: async () => {
      const res = await Conversations.getMessage(
        selectedContact?.conversationId,
      );
      if (res.data) {
        const sortedMessages = res.data
          ?.sort(
            (
              a: { created: string | number | Date },
              b: { created: string | number | Date },
            ) => {
              const dateA: any = new Date(a.created);
              const dateB: any = new Date(b.created);
              return dateA - dateB;
            },
          )
          ?.map((e: { created: any }) => ({
            ...e,
            createdAt: e.created,
          }));
        setMessageList(sortedMessages);
        return sortedMessages;
      } else {
        setMessageList([]);
        return [];
      }
    },
    enabled: !!selectedContact.conversationId,
  });

  // API lấy thông tin người muốn nhắn tin
  const { data: userInfo } = useQuery({
    queryKey: ["getUserInfo", selectedContact.contactId],
    queryFn: async () => {
      const res = await User.getUserInfo(selectedContact.contactId);
      return res.data as User;
    },
    enabled: !!selectedContact.contactId,
  });

  useEffect(() => {
    if (socketResponse) {
      if (isTyping) {
        setIsTyping(false);
      }
      addMessageToList(socketResponse);
    }
  }, [socketResponse]);

  const addMessageToList = (val: { content: string }) => {
    if (!val.content) return;
    setMessageList((oldMess: any) => [...oldMess, val]);
  };

  const sendMessage = (message: string) => {
    if (message !== "") {
      sendData({
        contactId: user?.userId,
        content: message,
        messageType: "TEXT",
        mediaLocation: selectedFiles?.length ? selectedFiles[0] : null,
      });
      setSelectedFiles([]);
    }
  };

  const handleKeyPress = (value: any) => {
    sendMessage(value);
  };

  const handleInputChange = (value: string) => {
    if (value.trim() !== "") {
      // Nếu có giá trị nhập liệu thì gửi sự kiện "typing" tới server
      sendTypingEvent({
        contactId: selectedContact.contactId,
        avatarLocation: user?.avatarLocation,
      });
    } else {
      sendStopTypingEvent();
      setIsTyping(false);
    }
  };

  // Start call
  const startCall = () => {
    socket?.emit("start_call", {
      user: user,
      remoteUser: userInfo,
    });
  };

  return (
    <>
      <div
        className="fixed bottom-0 right-0 top-0 z-[1000] rounded-md bg-white"
        style={{ width: chatOpen ? "360px" : "60px" }}
      >
        <div className="">
          {/* Header */}
          <div className="flex h-20 cursor-pointer items-center justify-between bg-neutral-700 px-4 transition-all">
            <div
              className="flex items-center gap-5 text-white"
              onClick={() => setChatOpen(true)}
            >
              <MessageIcon size={36} color={colors.primary600} />
              {(chatOpen && selectedContact.contactName) || "MY CHAT"}
            </div>
            {chatOpen && (
              <div className="flex gap-2">
                {selectedContact.contactId ? (
                  <div
                    className="hover:cursor-pointer"
                    onClick={() => {
                      setName({
                        myUser: user,
                        remoteUser: userInfo,
                      });
                      startCall();
                    }}
                  >
                    <CallIcon size={24} color="white" />
                  </div>
                ) : null}
                <CloseOutlined
                  style={{ color: "white", fontWeight: "bold" }}
                  onClick={() => {
                    setChatOpen(false);
                    setSelectedContact({ ...selectedContact, contactId: 0 });
                  }}
                />
              </div>
            )}
          </div>
          {/* content */}
          <div className="relative flex w-full ">
            <div
              className="custom-scrollbar flex h-[700px] w-[60px] shrink-0 flex-col"
              style={{ borderRight: "1px solid #cccc" }}
            >
              {lstConversations &&
                lstConversations.map((contact) => {
                  return (
                    <motion.div variants={item} key={contact.contactId}>
                      <ContactButton
                        contact={contact}
                        selectedContactId={selectedContact?.contactId}
                        onClick={(value) => {
                          setSelectedContact({
                            contactId: value.contactId,
                            contactName: value.contactName,
                            conversationId: contact.conversationId || 0,
                          });
                          setChatOpen(true);
                          dispatch(
                            chatAndCall({
                              contactId: value.contactId,
                              conversationId: contact.conversationId || 0,
                            }),
                          );
                        }}
                      />
                    </motion.div>
                  );
                })}
            </div>
            {/* Message */}
            {messageList?.length && selectedContact.contactId ? (
              <div
                className="custom-scrollbar  w-full  overscroll-contain px-2 pt-4 "
                style={{
                  height: "calc(100vh - 100px)",
                  paddingBottom: selectedFiles?.length > 0 ? "120px" : "34px",
                  overflowY: "auto",
                }}
              >
                <Spin spinning={isLoading}>
                  <ContentMessage
                    messages={messageList}
                    user={user}
                    userInfo={userInfo}
                    isFetching={isFetchingMessage}
                    isTyping={isTyping}
                    contactId={selectedContact.contactId}
                  />
                </Spin>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Image
                    width={400}
                    height={400}
                    alt=""
                    src="/images/chatBg.png"
                  />
                </div>
                <Typography
                  className="text-bold px-16  pt-10 text-center text-title-sm"
                  color="text.secondary"
                >
                  Chat cùng WeSign
                </Typography>
              </div>
            )}
          </div>

          {/* Input */}
          {selectedContact.contactId ? (
            <div className="w-full">
              <ChatInput
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  sendStopTypingEvent();
                }}
                onChange={handleInputChange}
                isFetching={isFetchingMessage}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
