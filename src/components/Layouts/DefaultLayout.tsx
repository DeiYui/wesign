"use client";
import React, { useState, ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Logo, MessageIcon } from "@/assets/icons";
import {
  CloseOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";
import BasicDrawer from "../draw/BasicDraw";
import { colors } from "@/assets/colors";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show chat
  const [chatOpen, setChatOpen] = useState(false);

  // Hàm để đảo ngược giá trị của sidebarOpen
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden ">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {sidebarOpen && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}

        {/* <!-- ===== Sidebar End ===== --> */}
        <button
          className=" rounded-full bg-white p-2 focus:outline-none dark:bg-boxdark"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <DoubleLeftOutlined size={24} />
          ) : (
            <DoubleRightOutlined size={24} />
          )}
        </button>
        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 pr-14 ">
              {children}
            </div>
          </main>
        </div>

        {/* Chat */}
        <div
          className="fixed bottom-0 right-0 top-0 z-[1000] rounded-md bg-white"
          style={{ width: chatOpen ? "360px" : "60px" }}
        >
          {/* Header */}
          <div className="flex h-20 cursor-pointer items-center justify-between bg-neutral-700 px-4 transition-all">
            <div
              className="flex items-center gap-4 text-white"
              onClick={() => setChatOpen(true)}
            >
              <MessageIcon size={36} color={colors.primary600} />

              {chatOpen && "MY CHAT"}
            </div>
            {chatOpen && (
              <div className="" onClick={() => setChatOpen(false)}>
                <CloseOutlined style={{ color: "white" }} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </>
  );
}
