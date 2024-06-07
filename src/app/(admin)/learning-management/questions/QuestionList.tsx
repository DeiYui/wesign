"use client";
import Learning from "@/model/Learning";
import Questions from "@/model/Questions";
import {
  DeleteOutlined,
  EditFilled,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  Empty,
  Image,
  Modal,
  Popover,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styled from "styled-components";
import { CustomTable } from "../check-list/ExamList";
import { CaretRightIcon } from "@/assets/icons";
import { renderAnswerValue } from "../check-list/create-edit/ModalChooseQuestions";
import { colors } from "@/assets/colors";
import { ConfirmModal } from "@/components/UI/Modal/ConfirmModal";

interface Answer {
  id: number;
  content: string;
  correct: boolean;
}

const QuestionList = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // filter
  const [filterParams, setFilterParams] = useState<{
    topicId: number;
    page?: number;
    size?: number;
  }>({
    topicId: 0,
    page: 0,
    size: 10,
  });

  // preview
  const [preview, setPreview] = useState<{
    open: boolean;
    file: string;
    fileVideo: string;
  }>({
    open: false,
    file: "",
    fileVideo: "",
  });

  // modal xác nhận xoá
  const [modalConfirm, setModalConfirm] = useState<{
    open: boolean;
    rowId: string | string[];
  }>({
    open: false,
    rowId: "",
  });

  // Lưu rowKey của những row đang được mở
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  const handleTableChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // API lấy danh sách câu hỏi
  const {
    data: allQuestion,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["getQuestionTopic", filterParams],
    queryFn: async () => {
      const res = await Questions.getQuestionTopic(filterParams.topicId);
      return res.data;
    },
  });

  // API lấy danh sách  topics
  const { data: allTopics } = useQuery({
    queryKey: ["getAllTopics"],
    queryFn: async () => {
      const res = await Learning.getAllTopics();
      return res?.data?.map((item: { topicId: any; content: any }) => ({
        id: item.topicId,
        value: item.topicId,
        label: item.content,
        text: item.content,
      }));
    },
  });

  // Xoá câu hỏi
  const mutationDel = useMutation({
    mutationFn: Questions.deleteQuestion,
    onSuccess: () => {
      message.success("Xoá câu hỏi thành công");
      refetch();
    },
  });

  const handleViewImage = (record: any) => {
    setPreview({
      open: true,
      file: record?.imageLocation,
      fileVideo: record?.videoLocation,
    });
  };

  const columns = [
    Table.SELECTION_COLUMN,
    Table.EXPAND_COLUMN,
    {
      title: "Tên câu hỏi",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Hình ảnh/Video",
      dataIndex: "imageLocation",
      key: "imageLocation",
      render: (imageLocation: string, record: any) => (
        <div>
          <Button onClick={() => handleViewImage(record)}>Xem</Button>
        </div>
      ),
      width: 140,
    },
    {
      title: "Đáp án đúng",
      dataIndex: "answerResList",
      key: "answerResList",
      render: (answerResList: Answer[]) => {
        const answersCorrect = answerResList?.filter(
          (answer) => answer.correct,
        );
        return (
          <>
            {answersCorrect?.slice(0, 3)?.map((answer, index) => (
              <Tag key={index} className="bg-green-500">
                <div className="p-1 text-sm font-bold text-white">
                  {answer.content}
                </div>
              </Tag>
            ))}
            <Popover
              content={
                <>
                  {answersCorrect
                    ?.slice(3, answersCorrect?.length)
                    ?.map((answer, index) => (
                      <Tag key={index} className="bg-green-500">
                        <div className="p-1 text-sm font-bold text-white">
                          {answer.content}
                        </div>
                      </Tag>
                    ))}
                </>
              }
            >
              {answersCorrect.length > 3 && (
                <Tag className="bg-green-500">
                  <div className="p-1 text-sm font-bold text-white">...</div>
                </Tag>
              )}
            </Popover>
          </>
        );
      },
      width: 300,
    },
    {
      fixed: "right",
      dataIndex: "questionId",
      width: "40px",
      align: "center",
      render: (value: string, record: any) => {
        const items = [
          {
            key: "1",
            label: (
              <div className="flex items-center gap-x-3 py-[3px]">
                <EditFilled />
                Chỉnh sửa
              </div>
            ),
          },
          {
            key: "2",
            label: (
              <div
                className="text-red600 flex items-center gap-x-3 py-[3px] text-red"
                onClick={() => setModalConfirm({ open: true, rowId: value })}
              >
                <DeleteOutlined />
                Xóa
              </div>
            ),
          },
        ];
        return (
          <Dropdown menu={{ items }}>
            <div className="flex w-5 items-center justify-center">
              <div className="hidden-table-action" key={record.attributeId}>
                <MoreOutlined />
              </div>
            </div>
          </Dropdown>
        );
      },
    },
  ];

  // hàm toggle đóng mở 1 hàng
  const toggleExpandRow = (key: number) => {
    if (expandedRowKeys.includes(key)) {
      setExpandedRowKeys(expandedRowKeys.filter((item) => item !== key));
    } else {
      setExpandedRowKeys([...expandedRowKeys, key]);
    }
  };

  return (
    <div className="w-full p-4">
      <h1 className="mb-4 text-2xl font-bold">Danh sách câu hỏi</h1>
      <div className="mb-4 flex  items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            className="w-[300px]"
            allowClear
            placeholder="Chủ đề"
            options={allTopics}
            onChange={(value, option: any) =>
              setFilterParams({ ...filterParams, topicId: value })
            }
          />
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            router.push("/learning-management/questions/add");
          }}
        >
          Thêm mới
        </Button>
      </div>
      <CustomTable
        className="mt-4"
        // rowSelection={rowSelection}
        rowKey={(record: any) => record.questionId}
        columns={columns}
        dataSource={allQuestion}
        pagination={{
          pageSize: pageSize,
          current: currentPage,
          onChange: handleTableChange,
          showSizeChanger: false,
          position: ["bottomCenter"],
        }}
        expandable={{
          rowExpandable: (record: any) => !!record.answerResList,
          expandedRowKeys,
          expandedRowRender: (record: any) =>
            renderAnswerValue(record.answerResList),
          expandIcon: ({ expanded, record }: any) => {
            if (!record.answerResList) return <div className="w-5" />;
            return (
              <div
                className={`flex transform items-center justify-center ${
                  expanded ? "rotate-90" : ""
                } transition-all duration-300`}
                onClick={() => toggleExpandRow(record.questionId)}
              >
                <CaretRightIcon />
              </div>
            );
          },
        }}
        locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
      />

      {/* modal preview */}
      <Modal
        title="Preview"
        open={preview.open}
        onCancel={() => setPreview({ file: "", open: false, fileVideo: "" })}
        footer={
          <>
            <Button
              onClick={() =>
                setPreview({ file: "", open: false, fileVideo: "" })
              }
            >
              Đóng
            </Button>
          </>
        }
        width={1000}
        centered
      >
        <div className="flex w-full items-center justify-between gap-3 p-4">
          {preview.file ? (
            <div className="flex w-full justify-center">
              <Image
                preview={false}
                className=""
                src={preview.file}
                alt="Ảnh chủ đề"
                style={{ width: 400, height: 400, objectFit: "contain" }}
              />
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <Empty description="Không có ảnh minh hoạ" />
            </div>
          )}
          {preview.fileVideo ? (
            <div className="flex w-full items-center justify-center">
              <video
                controls
                style={{
                  width: preview.file ? 400 : 600,
                  height: preview.file ? 300 : 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <source src={preview.fileVideo} />
              </video>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <Empty description="Không có video minh hoạ" />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal xác nhận xoá */}
      <ConfirmModal
        visible={modalConfirm.open}
        iconType="DELETE"
        title="Xóa câu hỏi"
        content="Hành động này sẽ xóa câu hỏi vĩnh viễn"
        confirmButtonText="Xác nhận"
        onClick={() => {
          mutationDel.mutate(modalConfirm.rowId);
        }}
        onCloseModal={() => setModalConfirm({ ...modalConfirm, open: false })}
      />
    </div>
  );
};

export default QuestionList;

export const PopoverButtonStyled = styled(Button)`
  &.ant-btn-default {
    background-color: unset;
    border: none;
    box-shadow: unset;
    border-radius: 8px;
    color: #181c25;
    width: 100%;
    display: flex;
    height: 44px;
    align-items: center;
  }
  &.ant-btn-default:not(:disabled):not(.ant-btn-disabled):hover {
    background-color: #2a6aeb;
    color: white;
  }
  &.ant-btn-default:not(:disabled):not(.ant-btn-disabled):active {
    background-color: #c9dafb;
    color: #0958d9;
  }
`;
