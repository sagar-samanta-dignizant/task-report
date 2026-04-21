import { useState } from "react";
import { App as AntdApp, Button, Input, Popconfirm, Tooltip } from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  deleteTemplate,
  duplicateTemplate,
  loadTemplates,
  renameTemplate,
} from "../../utils/templatesStore";
import type { TaskTemplate } from "../../types/task";
import "./TemplatesManager.css";

export const TemplatesManager = () => {
  const { message } = AntdApp.useApp();
  const [templates, setTemplates] = useState<TaskTemplate[]>(() => loadTemplates());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const beginEdit = (t: TaskTemplate) => {
    setEditingId(t.id);
    setEditName(t.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };
  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      message.warning("Template name can't be empty");
      return;
    }
    setTemplates(renameTemplate(editingId, trimmed));
    setEditingId(null);
    setEditName("");
    message.success("Renamed");
  };

  const handleDelete = (id: string) => {
    setTemplates(deleteTemplate(id));
    message.success("Template deleted");
  };

  const handleDuplicate = (id: string) => {
    setTemplates(duplicateTemplate(id));
    message.success("Template duplicated");
  };

  const countSubtasks = (t: TaskTemplate) =>
    t.tasks.reduce((n, task) => n + (task.subtasks?.length || 0), 0);

  return (
    <div className="templates-manager">
      {templates.length === 0 ? (
        <div className="templates-empty">
          <ProfileOutlined className="templates-empty-icon" />
          <div className="templates-empty-title">No templates yet</div>
          <div className="templates-empty-sub">
            Build a task list on the Home page, then use <b>Save as template</b> to
            capture it here.
          </div>
        </div>
      ) : (
        <div className="templates-list">
          {templates.map((t) => {
            const isEditing = editingId === t.id;
            const subCount = countSubtasks(t);
            return (
              <div key={t.id} className="template-row">
                <div className="template-row-main">
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onPressEnter={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="template-name-input"
                    />
                  ) : (
                    <span className="template-name" onDoubleClick={() => beginEdit(t)}>
                      {t.name}
                    </span>
                  )}
                  <span className="template-meta">
                    {t.tasks.length} task{t.tasks.length === 1 ? "" : "s"}
                    {subCount > 0 && ` · ${subCount} subtask${subCount === 1 ? "" : "s"}`}
                    <span className="template-meta-dot">·</span>
                    <span className="template-meta-date">
                      {dayjs(t.createdAt).format("DD MMM YYYY")}
                    </span>
                  </span>
                </div>
                <div className="template-row-actions">
                  {isEditing ? (
                    <>
                      <Tooltip title="Save">
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={commitEdit}
                        />
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <Button icon={<CloseOutlined />} onClick={cancelEdit} />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Rename">
                        <Button icon={<EditOutlined />} onClick={() => beginEdit(t)} />
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => handleDuplicate(t.id)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete this template?"
                        description={`"${t.name}" will be permanently removed.`}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                        onConfirm={() => handleDelete(t.id)}
                      >
                        <Button danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="templates-footnote">
        To apply a template, open <b>Home</b> and pick it from the <b>Templates</b>{" "}
        dropdown next to <b>Add task</b>. To save the current form as a new template,
        use <b>Save as template</b> from the same dropdown.
      </div>
    </div>
  );
};

export default TemplatesManager;
