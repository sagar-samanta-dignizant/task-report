import "./SettingsPage.css";

import { Avatar, Button, Input, Upload, Popconfirm, Modal, Progress, Checkbox, App as AntdApp } from "antd";
import React from "react";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  BranchesOutlined,
  EyeInvisibleOutlined,
  MinusSquareOutlined,
  LineOutlined,
  FontSizeOutlined,
  SettingOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  BgColorsOutlined,
  MenuOutlined,
  CloudSyncOutlined,
  BellOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import type { AllSettings } from "../types/task";
import SettingToggle from "../components/settings/SettingToggle";
import AccentPicker from "../components/settings/AccentPicker";
import ColumnOrder from "../components/settings/ColumnOrder";
import NotificationsSettings from "../components/settings/NotificationsSettings";
import TemplatesManager from "../components/settings/TemplatesManager";
import type { ExportColumnKey } from "../utils/exportColumns";

const CustomSwitch = ({ checked, onChange }: { checked: boolean | undefined; onChange: (checked: boolean) => void }) => {
  const isOn = !!checked;
  return (
    <div
      className={`custom-switch ${isOn ? "checked" : ""}`}
      onClick={() => onChange(!isOn)}
      role="switch"
      aria-checked={isOn}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onChange(!isOn);
      }}
    >
      <div className="switch-handle" />
    </div>
  );
};

const DEFAULT_PROJECTS = ["Rukkor", "Geometra"];

interface SettingsPageProps {
  settings: AllSettings;
  toggleSetting: (section: keyof AllSettings, key: string, value: unknown) => void;
  setProfilePicture: (url: string) => void;
}

interface SectionDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { key: "task", label: "Task", icon: <AppstoreOutlined />, description: "Which fields show on the form" },
  { key: "preview", label: "Preview", icon: <FileSearchOutlined />, description: "What the generated report includes" },
  { key: "general", label: "General", icon: <SettingOutlined />, description: "Defaults, projects, profile" },
  { key: "templates", label: "Templates", icon: <ProfileOutlined />, description: "Reusable task presets" },
  { key: "export", label: "Export", icon: <ExportOutlined />, description: "PDF & CSV export options" },
  { key: "notifications", label: "Reminders", icon: <BellOutlined />, description: "Custom messages and times" },
  { key: "backup", label: "Data", icon: <DatabaseOutlined />, description: "Backup, import, reset" },
];

const SettingsPage = ({ settings, toggleSetting, setProfilePicture }: SettingsPageProps) => {
  const { message } = AntdApp.useApp();
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [projectInput, setProjectInput] = React.useState("");
  const [projects, setProjects] = React.useState<string[]>(() => {
    const stored = localStorage.getItem("allProjects");
    return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
  });
  const [exportModalVisible, setExportModalVisible] = React.useState(false);
  const [importModalVisible, setImportModalVisible] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importDone, setImportDone] = React.useState(false);
  const [importSelectionModalVisible, setImportSelectionModalVisible] = React.useState(false);
  const [importKeys, setImportKeys] = React.useState<string[]>([]);
  const [importData, setImportData] = React.useState<Record<string, unknown>>({});
  const [selectedImportKeys, setSelectedImportKeys] = React.useState<string[]>([]);
  const [existingKeys, setExistingKeys] = React.useState<string[]>([]);
  const generateSettings = JSON.parse(localStorage.getItem("generateSettings") || "{}");

  const location = useLocation();
  const navigate = useNavigate();

  function getTabFromQuery() {
    const params = new URLSearchParams(location.search);
    return params.get("section");
  }
  React.useEffect(() => {
    const tab = getTabFromQuery();
    if (!tab) {
      const params = new URLSearchParams(location.search);
      params.set("section", "task");
      navigate({ search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeTab, setActiveTab] = React.useState(() => getTabFromQuery() || "task");
  React.useEffect(() => {
    setActiveTab(getTabFromQuery() || "task");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const params = new URLSearchParams(location.search);
    params.set("section", key);
    navigate({ search: params.toString() }, { replace: true });
  };

  React.useEffect(() => {
    if (!generateSettings.notificationTime) {
      toggleSetting("generateSettings", "notificationTime", "06:00 PM");
    }
  }, [generateSettings.notificationTime, toggleSetting]);

  const updateProjects = (newProjects: string[]) => {
    setProjects(newProjects);
    localStorage.setItem("allProjects", JSON.stringify(newProjects));
  };

  const handleAddProject = () => {
    const trimmed = projectInput.trim();
    if (!trimmed) return;
    if (projects.includes(trimmed)) {
      message.warning("Project already exists.");
      return;
    }
    updateProjects([...projects, trimmed]);
    setProjectInput("");
  };

  const getAllLocalStorageData = () => {
    const data: Record<string, unknown> = { __taskReportBackup: true, timestamp: new Date().toISOString() };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        const value = localStorage.getItem(key);
        data[key] = JSON.parse(value!);
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  };

  const activeSection = SECTIONS.find((s) => s.key === activeTab) || SECTIONS[0];

  return (
    <div className="settings-page">
      <div className="settings-shell">
        <aside className="settings-sidenav">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`settings-sidenav-item ${activeTab === s.key ? "active" : ""}`}
              onClick={() => handleTabChange(s.key)}
            >
              <span className="settings-sidenav-icon">{s.icon}</span>
              <span className="settings-sidenav-text">
                <span className="settings-sidenav-label">{s.label}</span>
                <span className="settings-sidenav-desc">{s.description}</span>
              </span>
            </button>
          ))}
        </aside>

        <div className="settings-content">
          <div className="settings-section-head">
            <h2>{activeSection.label}</h2>
            <p>{activeSection.description}</p>
          </div>

          {activeTab === "task" && (
            <div className="settings-group">
              <SettingToggle icon={<IdcardOutlined />} title="Show ID" description="Display a task ID column on the form.">
                <CustomSwitch checked={settings.taskSettings.showID} onChange={(v) => toggleSetting("taskSettings", "showID", v)} />
              </SettingToggle>
              <SettingToggle icon={<CalendarOutlined />} title="Show Date" description="Show the date picker next to the name.">
                <CustomSwitch checked={settings.taskSettings.showDate} onChange={(v) => toggleSetting("taskSettings", "showDate", v)} />
              </SettingToggle>
              <SettingToggle icon={<ProjectOutlined />} title="Show Project" description="Let you pick one or more projects per report.">
                <CustomSwitch checked={settings.taskSettings.showProject} onChange={(v) => toggleSetting("taskSettings", "showProject", v)} />
              </SettingToggle>
              <SettingToggle icon={<CheckSquareOutlined />} title="Show Status" description="Add a status dropdown to every task.">
                <CustomSwitch checked={settings.taskSettings.showStatus} onChange={(v) => toggleSetting("taskSettings", "showStatus", v)} />
              </SettingToggle>
              <SettingToggle icon={<ClockCircleOutlined />} title="Show Hours / Minutes" description="Track time spent per task.">
                <CustomSwitch checked={settings.taskSettings.showHours} onChange={(v) => toggleSetting("taskSettings", "showHours", v)} />
              </SettingToggle>
              <SettingToggle icon={<ArrowRightOutlined />} title="Show Next Task" description="Prompt for tomorrow's plan at the bottom of the form.">
                <CustomSwitch checked={settings.taskSettings.showNextTask} onChange={(v) => toggleSetting("taskSettings", "showNextTask", v)} />
              </SettingToggle>
              <SettingToggle icon={<BranchesOutlined />} title="Allow Subtasks" description="Nest smaller items under a parent task.">
                <CustomSwitch checked={settings.taskSettings.allowSubtask} onChange={(v) => toggleSetting("taskSettings", "allowSubtask", v)} />
              </SettingToggle>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="settings-two-col">
              <div className="settings-group">
                <SettingToggle icon={<IdcardOutlined />} title="Show ID" description="Include task IDs in the preview text.">
                  <CustomSwitch checked={settings.previewSettings.showID} onChange={(v) => toggleSetting("previewSettings", "showID", v)} />
                </SettingToggle>
                <SettingToggle icon={<CalendarOutlined />} title="Show Date" description="Prefix the preview with today's date.">
                  <CustomSwitch checked={settings.previewSettings.showDate} onChange={(v) => toggleSetting("previewSettings", "showDate", v)} />
                </SettingToggle>
                <SettingToggle icon={<ProjectOutlined />} title="Show Project" description="Include the project line in the preview.">
                  <CustomSwitch checked={settings.previewSettings.showProject} onChange={(v) => toggleSetting("previewSettings", "showProject", v)} />
                </SettingToggle>
                <SettingToggle icon={<CheckSquareOutlined />} title="Show Status" description="Append the status to each task line.">
                  <CustomSwitch checked={settings.previewSettings.showStatus} onChange={(v) => toggleSetting("previewSettings", "showStatus", v)} />
                </SettingToggle>
                <SettingToggle icon={<ClockCircleOutlined />} title="Show Hours" description="Append time spent to each task line.">
                  <CustomSwitch checked={settings.previewSettings.showHours} onChange={(v) => toggleSetting("previewSettings", "showHours", v)} />
                </SettingToggle>
                <SettingToggle icon={<ArrowRightOutlined />} title="Show Next Task" description="Include tomorrow's plan block.">
                  <CustomSwitch checked={settings.previewSettings.showNextTask} onChange={(v) => toggleSetting("previewSettings", "showNextTask", v)} />
                </SettingToggle>
                <SettingToggle icon={<BranchesOutlined />} title="Allow Subtasks" description="Render subtasks under their parent.">
                  <CustomSwitch checked={settings.previewSettings.allowSubtask} onChange={(v) => toggleSetting("previewSettings", "allowSubtask", v)} />
                </SettingToggle>
                <SettingToggle icon={<EyeInvisibleOutlined />} title="Hide parent time" description="Omit hours on parent rows when subtasks exist.">
                  <CustomSwitch checked={settings.previewSettings.hideParentTaskTime} onChange={(v) => toggleSetting("previewSettings", "hideParentTaskTime", v)} />
                </SettingToggle>
                <SettingToggle icon={<MinusSquareOutlined />} title="Hide parent status" description="Omit status on parent rows when subtasks exist.">
                  <CustomSwitch checked={settings.previewSettings.hideParentTaskStatus} onChange={(v) => toggleSetting("previewSettings", "hideParentTaskStatus", v)} />
                </SettingToggle>
              </div>
              <div className="settings-group">
                <SettingToggle icon={<LineOutlined />} title='Divider after "Work Update Text"' description="Dashes separator length.">
                  <CustomSwitch checked={settings.previewSettings.allowLineAfterWorkUpdate} onChange={(v) => toggleSetting("previewSettings", "allowLineAfterWorkUpdate", v)} />
                  {settings.previewSettings.allowLineAfterWorkUpdate && (
                    <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterWorkUpdate || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterWorkUpdate", parseInt(e.target.value, 10) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 70 }} />
                  )}
                </SettingToggle>
                <SettingToggle icon={<LineOutlined />} title='Divider after "Project"' description="Dashes separator length.">
                  <CustomSwitch checked={settings.previewSettings.allowLineAfterProject} onChange={(v) => toggleSetting("previewSettings", "allowLineAfterProject", v)} />
                  {settings.previewSettings.allowLineAfterProject && (
                    <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterProject || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterProject", parseInt(e.target.value, 10) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 70 }} />
                  )}
                </SettingToggle>
                <SettingToggle icon={<LineOutlined />} title='Divider after "Next Task"' description="Dashes separator length.">
                  <CustomSwitch checked={settings.previewSettings.allowLineAfterNextTask} onChange={(v) => toggleSetting("previewSettings", "allowLineAfterNextTask", v)} />
                  {settings.previewSettings.allowLineAfterNextTask && (
                    <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterNextTask || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterNextTask", parseInt(e.target.value, 10) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 70 }} />
                  )}
                </SettingToggle>
                <SettingToggle icon={<LineOutlined />} title='Divider before "Closing Text"' description="Dashes separator length.">
                  <CustomSwitch checked={settings.previewSettings.allowLineBeforeClosingText} onChange={(v) => toggleSetting("previewSettings", "allowLineBeforeClosingText", v)} />
                  {settings.previewSettings.allowLineBeforeClosingText && (
                    <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineBeforeClosingText || 3} onChange={(e) => toggleSetting("previewSettings", "lineBeforeClosingText", parseInt(e.target.value, 10) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 70 }} />
                  )}
                </SettingToggle>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="settings-two-col">
              <div className="settings-group">
                <SettingToggle
                  icon={<BgColorsOutlined />}
                  title="Accent color"
                  description="Pick the color used for buttons, highlights, and the sidebar's active state."
                  stacked
                >
                  <AccentPicker />
                </SettingToggle>
                <SettingToggle
                  icon={<CloudSyncOutlined />}
                  title="Auto-save draft"
                  description="Keep your in-progress form in memory. If you reload the page, your tasks come back. Clears on save or reset."
                >
                  <CustomSwitch
                    checked={settings.generateSettings.draftEnabled}
                    onChange={(v) => toggleSetting("generateSettings", "draftEnabled", v)}
                  />
                </SettingToggle>
                <SettingToggle icon={<LineOutlined />} title="Task gap" description="Blank lines between top-level tasks in the preview.">
                  <Input
                    type="number"
                    className="gap-input"
                    value={settings.generateSettings.taskGap || 1}
                    onChange={(e) => toggleSetting("generateSettings", "taskGap", parseInt(e.target.value, 10) || 1)}
                  />
                </SettingToggle>
                <SettingToggle icon={<LineOutlined />} title="Subtask gap" description="Blank lines between subtasks.">
                  <Input
                    type="number"
                    className="gap-input"
                    value={settings.generateSettings.subtaskGap || 1}
                    onChange={(e) => toggleSetting("generateSettings", "subtaskGap", parseInt(e.target.value, 10) || 1)}
                  />
                </SettingToggle>
                <SettingToggle icon={<FontSizeOutlined />} title="Work update heading" description="First line of every report.">
                  <Input
                    className="text-input"
                    value={generateSettings.workUpdateText || "Today's work update -"}
                    onChange={(e) => toggleSetting("generateSettings", "workUpdateText", e.target.value || "Today's work update -")}
                    style={{ width: 260 }}
                  />
                </SettingToggle>
                <SettingToggle icon={<FontSizeOutlined />} title="Closing text" description="Sign-off line above your name.">
                  <Input
                    className="text-input"
                    value={generateSettings.closingText || "Thanks & regards"}
                    onChange={(e) => toggleSetting("generateSettings", "closingText", e.target.value || "Thanks & regards")}
                    style={{ width: 260 }}
                  />
                </SettingToggle>
                <SettingToggle icon={<UploadOutlined />} title="Profile picture" description="Shown in the sidebar.">
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
                      if (!isJpgOrPng) {
                        message.error("You can only upload JPG/PNG files!");
                        return false;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        try {
                          localStorage.setItem("profilePicture", result);
                          setUploadedImage(result);
                          setProfilePicture(result);
                        } catch (error) {
                          if (error instanceof DOMException && error.name === "QuotaExceededError") {
                            message.error("Image is too large to store in localStorage.");
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                  {uploadedImage && (
                    <Avatar src={uploadedImage} size={36} style={{ border: "2px solid var(--accent)" }} />
                  )}
                </SettingToggle>
              </div>

              <div className="settings-group">
                <div className="project-manager">
                  <div className="project-add-row">
                    <Input
                      placeholder="Add new project"
                      value={projectInput}
                      onChange={(e) => setProjectInput(e.target.value)}
                      onPressEnter={handleAddProject}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProject}>
                      Add
                    </Button>
                  </div>
                  <div className="project-list">
                    {projects.map((item, idx) => (
                      <div key={item} className="project-item">
                        <span className="project-idx">{idx + 1}.</span>
                        <span className={`project-name ${DEFAULT_PROJECTS.includes(item) ? "is-default" : ""}`}>
                          {item}
                        </span>
                        {!DEFAULT_PROJECTS.includes(item) && (
                          <Popconfirm
                            title="Remove this project?"
                            onConfirm={() => updateProjects(projects.filter((p) => p !== item))}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              icon={<DeleteOutlined style={{ color: "var(--danger)" }} />}
                              size="small"
                            />
                          </Popconfirm>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="settings-group">
              <SettingToggle icon={<IdcardOutlined />} title="Include ID column" description="Print task IDs in the export.">
                <CustomSwitch checked={settings.exportSettings.showID} onChange={(v) => toggleSetting("exportSettings", "showID", v)} />
              </SettingToggle>
              <SettingToggle icon={<CalendarOutlined />} title="Include Date column" description="Group rows by date.">
                <CustomSwitch checked={settings.exportSettings.showDate} onChange={(v) => toggleSetting("exportSettings", "showDate", v)} />
              </SettingToggle>
              <SettingToggle icon={<ProjectOutlined />} title="Include Project" description="Show the project name per row.">
                <CustomSwitch checked={settings.exportSettings.showProject} onChange={(v) => toggleSetting("exportSettings", "showProject", v)} />
              </SettingToggle>
              <SettingToggle icon={<CheckSquareOutlined />} title="Include Status" description="Show each task's status.">
                <CustomSwitch checked={settings.exportSettings.showStatus} onChange={(v) => toggleSetting("exportSettings", "showStatus", v)} />
              </SettingToggle>
              <SettingToggle icon={<ClockCircleOutlined />} title="Include Time" description="Show hours + minutes.">
                <CustomSwitch checked={settings.exportSettings.showHours} onChange={(v) => toggleSetting("exportSettings", "showHours", v)} />
              </SettingToggle>
              <SettingToggle icon={<ArrowRightOutlined />} title="Include Next Task" description="Append tomorrow's plan at the bottom.">
                <CustomSwitch checked={settings.exportSettings.showNextTask} onChange={(v) => toggleSetting("exportSettings", "showNextTask", v)} />
              </SettingToggle>
              <SettingToggle icon={<BranchesOutlined />} title="Include Subtasks" description="Render subtasks under their parent row.">
                <CustomSwitch checked={settings.exportSettings.allowSubtask} onChange={(v) => toggleSetting("exportSettings", "allowSubtask", v)} />
              </SettingToggle>
              <SettingToggle
                icon={<MenuOutlined />}
                title="Column order"
                description="Drag to set the order columns appear in PDF and CSV exports."
                stacked
              >
                <ColumnOrder
                  order={(settings.exportSettings as unknown as { columnOrder?: string[] }).columnOrder}
                  enabled={{
                    showID: settings.exportSettings.showID,
                    showDate: settings.exportSettings.showDate,
                    showStatus: settings.exportSettings.showStatus,
                    showHours: settings.exportSettings.showHours,
                    showProject: settings.exportSettings.showProject,
                  }}
                  onChange={(next: ExportColumnKey[]) =>
                    toggleSetting("exportSettings", "columnOrder", next)
                  }
                />
              </SettingToggle>
            </div>
          )}

          {activeTab === "templates" && <TemplatesManager />}

          {activeTab === "notifications" && <NotificationsSettings />}

          {activeTab === "backup" && (
            <div className="settings-group">
              <div className="backup-card">
                <div className="backup-row">
                  <div className="backup-row-text">
                    <div className="backup-row-title">Export backup</div>
                    <div className="backup-row-desc">Download a JSON file of all projects, settings, and reports.</div>
                  </div>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={() => {
                      setExportModalVisible(true);
                      setExportProgress(0);
                      let progress = 0;
                      const interval = setInterval(() => {
                        progress += 20;
                        setExportProgress(progress);
                        if (progress >= 100) {
                          clearInterval(interval);
                          setTimeout(() => {
                            const backupData = getAllLocalStorageData();
                            const now = new Date();
                            const date = now.toISOString().slice(0, 10);
                            const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
                            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `task-report-backup-${date}_${time}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setExportModalVisible(false);
                          }, 400);
                        }
                      }, 150);
                    }}
                  >
                    Export
                  </Button>
                </div>

                <div className="backup-row">
                  <div className="backup-row-text">
                    <div className="backup-row-title">Import backup</div>
                    <div className="backup-row-desc">Restore from a backup file exported above.</div>
                  </div>
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    id="import-backup-input"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        if (!data.__taskReportBackup) {
                          message.error("File format not supported.");
                          return;
                        }
                        const keys = Object.keys(data).filter((k) => k !== "__taskReportBackup" && k !== "timestamp");
                        setImportData(data);
                        setImportKeys(keys);
                        setSelectedImportKeys(keys);
                        const existing = keys.filter((k) => localStorage.getItem(k) !== null);
                        setExistingKeys(existing);
                        setImportSelectionModalVisible(true);
                      } catch {
                        message.error("Failed to import backup.");
                      }
                    }}
                  />
                  <Button
                    icon={<ImportOutlined />}
                    onClick={() => document.getElementById("import-backup-input")?.click()}
                  >
                    Import
                  </Button>
                </div>

                <div className="backup-row danger">
                  <div className="backup-row-text">
                    <div className="backup-row-title">Reset app</div>
                    <div className="backup-row-desc">Permanently delete all local data: projects, settings, reports, profile.</div>
                  </div>
                  <Button
                    danger
                    type="primary"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: "Clear all app data?",
                        content: "This cannot be undone. All local data will be lost.",
                        okText: "Yes, clear",
                        okType: "danger",
                        cancelText: "Cancel",
                        centered: true,
                        onOk: () => {
                          localStorage.clear();
                          window.location.replace(window.location.pathname);
                        },
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={exportModalVisible} footer={null} closable={false} centered maskClosable={false} title="Exporting backup">
        <Progress percent={exportProgress} status={exportProgress < 100 ? "active" : "success"} />
        <div style={{ marginTop: 14, color: "var(--text-muted)" }}>Preparing your backup file…</div>
      </Modal>
      <Modal
        open={importModalVisible}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        title={importDone ? "Import complete" : "Importing backup"}
      >
        {importDone ? (
          <div style={{ textAlign: "center" }}>
            <Progress percent={100} status="success" />
            <div style={{ margin: "16px 0", color: "var(--success)", fontWeight: 600 }}>Backup imported.</div>
            <Button type="primary" onClick={() => window.location.reload()}>
              Apply changes
            </Button>
          </div>
        ) : (
          <>
            <Progress percent={importProgress} status="active" />
            <div style={{ marginTop: 14, color: "var(--text-muted)" }}>Restoring your data…</div>
          </>
        )}
      </Modal>
      <Modal
        open={importSelectionModalVisible}
        title="Select data to import"
        onCancel={() => setImportSelectionModalVisible(false)}
        onOk={async () => {
          setImportSelectionModalVisible(false);
          setImportModalVisible(true);
          setImportProgress(0);
          setImportDone(false);
          let progress = 0;
          for (let i = 0; i < selectedImportKeys.length; i++) {
            const key = selectedImportKeys[i];
            const value = importData[key];
            try {
              if (typeof value === "object") {
                localStorage.setItem(key, JSON.stringify(value));
              } else {
                localStorage.setItem(key, value as string);
              }
            } catch {
              // skip on quota error
            }
            progress = Math.round(((i + 1) / selectedImportKeys.length) * 100);
            setImportProgress(progress);
            await new Promise((res) => setTimeout(res, 80));
          }
          setImportDone(true);
        }}
        okText="Import selected"
        cancelText="Cancel"
        centered
        width={720}
      >
        {existingKeys.length > 0 && (
          <div style={{ marginBottom: 12, color: "var(--danger)", fontWeight: 500 }}>
            {existingKeys.length} existing {existingKeys.length === 1 ? "entry" : "entries"} will be replaced.
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <Checkbox
            indeterminate={selectedImportKeys.length > 0 && selectedImportKeys.length < importKeys.length}
            checked={selectedImportKeys.length === importKeys.length}
            onChange={(e) => setSelectedImportKeys(e.target.checked ? importKeys : [])}
          >
            Select all
          </Checkbox>
        </div>
        <div className="import-keys-grid">
          {importKeys.map((key) => (
            <label key={key} className={`import-key ${existingKeys.includes(key) ? "is-existing" : ""}`}>
              <Checkbox
                checked={selectedImportKeys.includes(key)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedImportKeys([...selectedImportKeys, key]);
                  else setSelectedImportKeys(selectedImportKeys.filter((k) => k !== key));
                }}
              />
              <span className="import-key-name">{key}</span>
              {existingKeys.includes(key) && <span className="import-key-flag">will replace</span>}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
