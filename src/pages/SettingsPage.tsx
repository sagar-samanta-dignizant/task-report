import "./SettingsPage.css"; // Import custom CSS for the settings page

import { Avatar, Button, Input, Upload, message,  Popconfirm, Tabs, Modal, Progress, Checkbox } from "antd"; // Import Ant Design Input, Upload, Button, Avatar, message, List, Popconfirm, Tabs, Modal, Progress, and Checkbox components

import React from "react";
import { UploadOutlined, PlusOutlined, DeleteOutlined, ExportOutlined, ImportOutlined, ExclamationCircleOutlined } from "@ant-design/icons"; // Import Upload, Plus, Delete, Export, Import, and Exclamation Circle icons

const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <div
        className={`custom-switch ${checked ? "checked" : ""}`}
        onClick={() => onChange(!checked)}
    >
        <div className="switch-handle" />
    </div>
);

const DEFAULT_PROJECTS = ["Rukkor", "Geometra"];


import { useLocation, useNavigate } from "react-router-dom";

const SettingsPage = ({ settings, toggleSetting, setProfilePicture }: any) => {
    const [uploadedImage, setUploadedImage] = React.useState<string | null>(null); // State for uploaded image preview
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
    const [importData, setImportData] = React.useState<any>({});
    const [selectedImportKeys, setSelectedImportKeys] = React.useState<string[]>([]);
    const [existingKeys, setExistingKeys] = React.useState<string[]>([]);
    const generateSettings = JSON.parse(localStorage.getItem("generateSettings") || "{}");

    // --- Tab state with URL query ---
    const location = useLocation();
    const navigate = useNavigate();
    function getTabFromQuery() {
        const params = new URLSearchParams(location.search);
        return params.get("section");
    }
    // On mount, if no tab in query, set it to default (task)
    React.useEffect(() => {
        const tab = getTabFromQuery();
        if (!tab) {
            const params = new URLSearchParams(location.search);
            params.set("section", "task");
            navigate({ search: params.toString() }, { replace: true });
        }
    }, []);
    const [activeTab, setActiveTab] = React.useState(() => getTabFromQuery() || "task");
    React.useEffect(() => {
        setActiveTab(getTabFromQuery() || "task");
        // eslint-disable-next-line
    }, [location.search]);
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        const params = new URLSearchParams(location.search);
        params.set("section", key);
        navigate({ search: params.toString() }, { replace: true });
    };

    // Ensure default notification time is set to 6:00 PM if not already set
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

    // const handleRemoveProject = (project: string) => {
    //     if (DEFAULT_PROJECTS.includes(project)) {
    //         message.error("Default projects cannot be removed.");
    //         return;
    //     }
    //     updateProjects(projects.filter((p) => p !== project));
    // };

    // Helper: Get all localStorage keys for backup
    const getAllLocalStorageData = () => {
        const data: Record<string, any> = { __taskReportBackup: true, timestamp: new Date().toISOString() };
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                try {
                    // Try to parse JSON, fallback to string
                    const value = localStorage.getItem(key);
                    data[key] = JSON.parse(value!);
                } catch {
                    data[key!] = localStorage.getItem(key!);
                }
            }
        }
        return data;
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    type="card"
                    size="large"
                    className="settings-tabs"
                >

                    <Tabs.TabPane tab="Task Settings" key="task">
                        {/* Task Settings Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Task Settings</h3>
                            <div className="settings-option">
                                <label>
                                    Show ID
                                    <CustomSwitch
                                        checked={settings.taskSettings.showID}
                                        onChange={(checked) => toggleSetting("taskSettings", "showID", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Date
                                    <CustomSwitch
                                        checked={settings.taskSettings.showDate}
                                        onChange={(checked) => toggleSetting("taskSettings", "showDate", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Project
                                    <CustomSwitch
                                        checked={settings.taskSettings.showProject}
                                        onChange={(checked) => toggleSetting("taskSettings", "showProject", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Status
                                    <CustomSwitch
                                        checked={settings.taskSettings.showStatus}
                                        onChange={(checked) => toggleSetting("taskSettings", "showStatus", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Hrs/min
                                    <CustomSwitch
                                        checked={settings.taskSettings.showHours}
                                        onChange={(checked) => toggleSetting("taskSettings", "showHours", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Next Task
                                    <CustomSwitch
                                        checked={settings.taskSettings.showNextTask}
                                        onChange={(checked) => toggleSetting("taskSettings", "showNextTask", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Subtask
                                    <CustomSwitch
                                        checked={settings.taskSettings.allowSubtask}
                                        onChange={(checked) => toggleSetting("taskSettings", "allowSubtask", checked)}
                                    />
                                </label>
                            </div>
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Preview Settings" key="preview">
                        {/* Preview Settings Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Preview Settings</h3>
                            <div style={{ display: 'flex', gap: 32 }}>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {/* Left column: first half of options */}
                                    <div className="settings-option">
                                        <label>Show ID
                                            <CustomSwitch checked={settings.previewSettings.showID} onChange={(checked) => toggleSetting("previewSettings", "showID", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Show Date
                                            <CustomSwitch checked={settings.previewSettings.showDate} onChange={(checked) => toggleSetting("previewSettings", "showDate", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Show Project
                                            <CustomSwitch checked={settings.previewSettings.showProject} onChange={(checked) => toggleSetting("previewSettings", "showProject", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Show Status
                                            <CustomSwitch checked={settings.previewSettings.showStatus} onChange={(checked) => toggleSetting("previewSettings", "showStatus", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Show Hours
                                            <CustomSwitch checked={settings.previewSettings.showHours} onChange={(checked) => toggleSetting("previewSettings", "showHours", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Show Next Task
                                            <CustomSwitch checked={settings.previewSettings.showNextTask} onChange={(checked) => toggleSetting("previewSettings", "showNextTask", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Allow Subtask
                                            <CustomSwitch checked={settings.previewSettings.allowSubtask} onChange={(checked) => toggleSetting("previewSettings", "allowSubtask", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Hide Parent Task Hours/Minutes (if Subtasks Exist)
                                            <CustomSwitch checked={settings.previewSettings.hideParentTaskTime} onChange={(checked) => toggleSetting("previewSettings", "hideParentTaskTime", checked)} />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>Hide Parent Task Status (if Subtasks Exist)
                                            <CustomSwitch checked={settings.previewSettings.hideParentTaskStatus} onChange={(checked) => toggleSetting("previewSettings", "hideParentTaskStatus", checked)} />
                                        </label>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {/* Right column: second half of options */}


                                    <div className="settings-option">
                                        <label>Allow Line After "Work Update Text"
                                            <CustomSwitch checked={settings.previewSettings.allowLineAfterWorkUpdate} onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterWorkUpdate", checked)} />
                                        </label>
                                        {settings.previewSettings.allowLineAfterWorkUpdate && (
                                            <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterWorkUpdate || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterWorkUpdate", parseInt(e.target.value) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 200 }} />
                                        )}
                                    </div>
                                    <div className="settings-option">
                                        <label>Allow Line After "Project"
                                            <CustomSwitch checked={settings.previewSettings.allowLineAfterProject} onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterProject", checked)} />
                                        </label>
                                        {settings.previewSettings.allowLineAfterProject && (
                                            <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterProject || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterProject", parseInt(e.target.value) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 200 }} />
                                        )}
                                    </div>
                                    <div className="settings-option">
                                        <label>Allow Line After "Next Task"
                                            <CustomSwitch checked={settings.previewSettings.allowLineAfterNextTask} onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterNextTask", checked)} />
                                        </label>
                                        {settings.previewSettings.allowLineAfterNextTask && (
                                            <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineAfterNextTask || 3} onChange={(e) => toggleSetting("previewSettings", "lineAfterNextTask", parseInt(e.target.value) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 200 }} />
                                        )}
                                    </div>
                                    <div className="settings-option">
                                        <label>Allow Line Before "Closing Text"
                                            <CustomSwitch checked={settings.previewSettings.allowLineBeforeClosingText} onChange={(checked) => toggleSetting("previewSettings", "allowLineBeforeClosingText", checked)} />
                                        </label>
                                        {settings.previewSettings.allowLineBeforeClosingText && (
                                            <Input type="number" className="line-input" placeholder="Len" value={settings.previewSettings.lineBeforeClosingText || 3} onChange={(e) => toggleSetting("previewSettings", "lineBeforeClosingText", parseInt(e.target.value) || 3)} onWheel={(e) => e.currentTarget.blur()} style={{ width: 200 }} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="General Settings" key="general">
                        {/* Generate Settings Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">General Settings</h3>
                            <div style={{ display: 'flex', gap: 32 }}>
                                {/* Left column: previous general settings content */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div className="settings-option">
                                        <label>
                                            Task Gap
                                            <input
                                                type="number"
                                                className="gap-input"
                                                value={settings.generateSettings.taskGap || 1}
                                                onChange={(e) =>
                                                    toggleSetting("generateSettings", "taskGap", parseInt(e.target.value) || 1)
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>
                                            Subtask Gap
                                            <input
                                                type="number"
                                                className="gap-input"
                                                value={settings.generateSettings.subtaskGap || 1}
                                                onChange={(e) =>
                                                    toggleSetting("generateSettings", "subtaskGap", parseInt(e.target.value) || 1)
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>
                                            Work Update Text
                                            <Input
                                                className="text-input"
                                                value={generateSettings.workUpdateText || "Today's work update -"}
                                                onChange={(e) =>
                                                    toggleSetting("generateSettings", "workUpdateText", e.target.value || "Today's work update -")
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>
                                            Closing Text
                                            <Input
                                                className="text-input"
                                                value={generateSettings.closingText || "Thanks & regards"}
                                                onChange={(e) =>
                                                    toggleSetting("generateSettings", "closingText", e.target.value || "Thanks & regards")
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="settings-option">
                                        <label>
                                            Upload Profile Picture
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
                                                            } else {
                                                                console.error("Failed to store image:", error);
                                                            }
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                    return false;
                                                }}
                                            >
                                                <Button icon={<UploadOutlined />}>Upload</Button>
                                            </Upload>
                                        </label>
                                        {uploadedImage && (
                                            <Avatar
                                                src={uploadedImage}
                                                size={64}
                                                style={{ marginTop: "10px", border: "1px solid #4caf50" }}
                                            />
                                        )}
                                    </div>
                                </div>
                                {/* Right column: Add Project and Project List */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                                        <Input
                                            placeholder="Add new project"
                                            value={projectInput}
                                            onChange={e => setProjectInput(e.target.value)}
                                            onPressEnter={handleAddProject}
                                            style={{ maxWidth: 220 }}

                                        />
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleAddProject}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
                                        {projects.map((item, idx) => (
                                            <div
                                                key={item}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: 'linear-gradient(90deg, #23272f 60%, #23272f 100%)',
                                                    boxShadow: '0 1px 6px 0 rgba(60,70,90,0.08)',
                                                    borderRadius: 8,
                                                    padding: '6px 10px',
                                                    border: '1px solid #23272f',
                                                    transition: 'box-shadow 0.2s, border 0.2s',
                                                    position: 'relative',
                                                    cursor: 'default',
                                                    minWidth: 0,
                                                    maxWidth: 260,
                                                }}
                                                onMouseOver={e => {
                                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px 0 rgba(76,175,80,0.10)';
                                                    (e.currentTarget as HTMLDivElement).style.border = '1.5px solid #4caf50';
                                                }}
                                                onMouseOut={e => {
                                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px 0 rgba(60,70,90,0.08)';
                                                    (e.currentTarget as HTMLDivElement).style.border = '1px solid #23272f';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ color: '#bbb', fontWeight: 400, fontSize: 13, minWidth: 18, textAlign: 'right' }}>{idx + 1}.</span>
                                                    <span style={{
                                                        color: DEFAULT_PROJECTS.includes(item) ? '#43a047' : '#fff',
                                                        fontWeight: DEFAULT_PROJECTS.includes(item) ? 700 : 500,
                                                        fontSize: 15,
                                                        letterSpacing: 0.1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                        {item}                                                        
                                                    </span>
                                                </div>
                                                {!DEFAULT_PROJECTS.includes(item) && (
                                                    <Popconfirm
                                                        title="Remove this project?"
                                                        onConfirm={() => {
                                                            setProjects(projects.filter((p) => p !== item));
                                                            localStorage.setItem("allProjects", JSON.stringify(projects.filter((p) => p !== item)));
                                                        }}
                                                        okText="Yes"
                                                        cancelText="No"
                                                    >
                                                        <Button
                                                            type="text"
                                                            icon={<DeleteOutlined style={{ color: '#ff5252', fontSize: 16 }} />}
                                                            danger
                                                            size="small"
                                                            style={{
                                                                marginLeft: 6,
                                                                background: 'rgba(255,82,82,0.08)',
                                                                border: 'none',
                                                                boxShadow: 'none',
                                                                borderRadius: 6,
                                                                transition: 'background 0.2s',
                                                                height: 24,
                                                                width: 24,
                                                                minWidth: 24,
                                                                padding: 0,
                                                            }}
                                                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,82,82,0.18)')}
                                                            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,82,82,0.08)')}
                                                        />
                                                    </Popconfirm>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Export Settings" key="export">
                        {/* Export Settings Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Export Settings</h3>
                            <div className="settings-option">
                                <label>
                                    Show ID
                                    <CustomSwitch
                                        checked={settings.exportSettings.showID}
                                        onChange={(checked) => toggleSetting("exportSettings", "showID", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Date
                                    <CustomSwitch
                                        checked={settings.exportSettings.showDate}
                                        onChange={(checked) => toggleSetting("exportSettings", "showDate", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Project
                                    <CustomSwitch
                                        checked={settings.exportSettings.showProject}
                                        onChange={(checked) => toggleSetting("exportSettings", "showProject", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Status
                                    <CustomSwitch
                                        checked={settings.exportSettings.showStatus}
                                        onChange={(checked) => toggleSetting("exportSettings", "showStatus", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Hours
                                    <CustomSwitch
                                        checked={settings.exportSettings.showHours}
                                        onChange={(checked) => toggleSetting("exportSettings", "showHours", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Next Task
                                    <CustomSwitch
                                        checked={settings.exportSettings.showNextTask}
                                        onChange={(checked) => toggleSetting("exportSettings", "showNextTask", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Subtask
                                    <CustomSwitch
                                        checked={settings.exportSettings.allowSubtask}
                                        onChange={(checked) => toggleSetting("exportSettings", "allowSubtask", checked)}
                                    />
                                </label>
                            </div>
                        </div>
                    </Tabs.TabPane>

                    <Tabs.TabPane tab="Backup & Reset" key="backup">
                        {/* Backup & Restore Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Backup</h3>
                            <div className="settings-option">
                                <Button
                                    type="primary"
                                    icon={<ExportOutlined />}
                                    style={{ background: '#23272f', color: '#4caf50', border: '1px solid #333', marginRight: 12 }}
                                    onClick={async () => {
                                        setExportModalVisible(true);
                                        setExportProgress(0);
                                        // Simulate progress for UX
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
                                                    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
                                                    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `task-report-backup-${date}_${time}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                    setExportModalVisible(false);
                                                }, 500);
                                            }
                                        }, 200);
                                    }}
                                >
                                    Export Data
                                </Button>
                                <input
                                    type="file"
                                    accept="application/json"
                                    style={{ display: 'none' }}
                                    id="import-backup-input"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const text = await file.text();
                                            const data = JSON.parse(text);
                                            if (!data.__taskReportBackup) {
                                                message.error("File format not supported. Please select a valid Task Report backup file.");
                                                return;
                                            }
                                            const keys = Object.keys(data).filter(k => k !== "__taskReportBackup" && k !== "timestamp");
                                            setImportData(data);
                                            setImportKeys(keys);
                                            setSelectedImportKeys(keys);
                                            // Find which keys already exist in localStorage
                                            const existing = keys.filter(k => localStorage.getItem(k) !== null);
                                            setExistingKeys(existing);
                                            setImportSelectionModalVisible(true);
                                        } catch {
                                            message.error("Failed to import backup. File may be corrupted or invalid.");
                                        }
                                    }}
                                />
                                <Button
                                    type="primary"
                                    icon={<ImportOutlined />}
                                    style={{ background: '#23272f', color: '#4caf50', border: '1px solid #333' }}
                                    onClick={() => document.getElementById('import-backup-input')?.click()}
                                >
                                    Import Data
                                </Button>
                                <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
                                    Export your data as a backup JSON file. Import it on another device to restore your projects and settings.<br />
                                    Only files exported from this app are supported.
                                </div>
                                {/* Divider for separation */}
                                <div style={{ borderTop: '1px solid #333', margin: '24px 0 16px 0', width: '100%' }} />

                                <Button
                                    danger
                                    type="primary"
                                    icon={<ExclamationCircleOutlined />}
                                    style={{ background: '#b71c1c', border: '1px solid #b71c1c', color: '#fff', }}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Clear All App Data?',
                                            content: (
                                                <div>
                                                    <div style={{ color: '#e53935', fontWeight: 600, marginBottom: 8 }}>
                                                        This will remove <b>all your saved projects, settings, reports, profile picture, and any other data</b> stored in your browser for this app.
                                                    </div>
                                                    <div style={{ color: '#888', fontSize: 13 }}>
                                                        This action <b>cannot be undone</b>. You will lose all your local data for this app.<br />
                                                        Are you sure you want to continue?
                                                    </div>
                                                </div>
                                            ),
                                            okText: 'Yes, Clear All Data',
                                            okType: 'danger',
                                            cancelText: 'Cancel',
                                            centered: true,
                                            onOk: () => {
                                                localStorage.clear();
                                                window.location.replace(window.location.pathname);
                                            },
                                        });
                                    }}
                                >
                                    Reset APP
                                </Button>
                                <div style={{ color: '#e53935', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
                                    Reset will permanently delete all (Except deafult) your saved projects, settings, reports, profile picture, and any other data stored in your browser for this app. This cannot be undone.
                                </div>
                            </div>
                        </div>
                        {/* Export Progress Modal */}
                        <Modal open={exportModalVisible} footer={null} closable={false} centered maskClosable={false} title="Exporting Backup...">
                            <Progress percent={exportProgress} status={exportProgress < 100 ? "active" : "success"} />
                            <div style={{ marginTop: 16, color: '#888' }}>Preparing your backup file...</div>
                        </Modal>
                        {/* Import Progress Modal */}
                        <Modal open={importModalVisible} footer={null} closable={false} centered maskClosable={false} title={importDone ? "Import Complete" : "Importing Backup..."}>
                            {importDone ? (
                                <div style={{ textAlign: 'center' }}>
                                    <Progress percent={100} status="success" />
                                    <div style={{ margin: '16px 0', color: '#4caf50', fontWeight: 600 }}>Backup imported successfully!</div>
                                    <Button type="primary" onClick={() => window.location.reload()}>Apply Changes</Button>
                                </div>
                            ) : (
                                <>
                                    <Progress percent={importProgress} status="active" />
                                    <div style={{ marginTop: 16, color: '#888' }}>Restoring your data...</div>
                                </>
                            )}
                        </Modal>
                        {/* Import Selection Modal */}
                        <Modal
                            open={importSelectionModalVisible}
                            title="Select Data to Import"
                            onCancel={() => setImportSelectionModalVisible(false)}
                            onOk={async () => {
                                setImportSelectionModalVisible(false);
                                setImportModalVisible(true);
                                setImportProgress(0);
                                setImportDone(false);
                                // Simulate progress for UX
                                let progress = 0;
                                for (let i = 0; i < selectedImportKeys.length; i++) {
                                    const key = selectedImportKeys[i];
                                    let value = importData[key];
                                    try {
                                        if (typeof value === "object") {
                                            localStorage.setItem(key, JSON.stringify(value));
                                        } else {
                                            localStorage.setItem(key, value);
                                        }
                                    } catch { }
                                    progress = Math.round(((i + 1) / selectedImportKeys.length) * 100);
                                    setImportProgress(progress);
                                    // eslint-disable-next-line no-await-in-loop
                                    await new Promise(res => setTimeout(res, 100));
                                }
                                setImportDone(true);
                            }}
                            okText="Import Selected"
                            cancelText="Cancel"
                            centered
                            width={900}
                        >
                            <div style={{ marginBottom: 12, color: '#e53935', fontWeight: 500 }}>
                                {existingKeys.length > 0 ? (
                                    <>
                                        <span>Warning: Importing will <b>replace existing data</b> for the following keys:</span>
                                        <ul style={{ margin: '8px 0 0 18px', color: '#ff9800', fontSize: 13 }}>
                                            {existingKeys.map(k => <li key={k}>{k}</li>)}
                                        </ul>
                                    </>
                                ) : (
                                    <span>Choose which data to import. New data will be added.</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                <Checkbox
                                    indeterminate={selectedImportKeys.length > 0 && selectedImportKeys.length < importKeys.length}
                                    checked={selectedImportKeys.length === importKeys.length}
                                    onChange={e => setSelectedImportKeys(e.target.checked ? importKeys : [])}
                                    style={{ fontWeight: 500 }}
                                >
                                    Select All
                                </Checkbox>
                            </div>
                            {/* Split keys into two columns for compactness */}
                            {(() => {
                                const mid = Math.ceil(importKeys.length / 2);
                                const leftKeys = importKeys.slice(0, mid);
                                const rightKeys = importKeys.slice(mid);
                                return (
                                    <div style={{ display: 'flex', gap: 24, width: '100%' }}>
                                        {[leftKeys, rightKeys].map((colKeys, colIdx) => (
                                            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
                                                {/* Table header */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px', background: '#22252b', borderTopLeftRadius: colIdx === 0 ? 8 : 0, borderTopRightRadius: colIdx === 1 ? 8 : 0, border: '1px solid #333', borderBottom: 'none' }}>
                                                    <div style={{ padding: '8px 16px', fontWeight: 600, color: '#fff', fontSize: 16 }}>Key</div>
                                                    <div style={{ padding: '8px 16px', fontWeight: 600, color: '#fff', fontSize: 16, textAlign: 'center' }}>Import?</div>
                                                </div>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr 80px',
                                                    border: '1px solid #333',
                                                    borderTop: 'none',
                                                    borderBottomLeftRadius: colIdx === 0 ? 8 : 0,
                                                    borderBottomRightRadius: colIdx === 1 ? 8 : 0,
                                                    background: '#191c22',
                                                    overflow: 'hidden',
                                                }}>
                                                    {colKeys.map(key => (
                                                        <React.Fragment key={key}>
                                                            <div style={{ padding: '8px 16px', color: existingKeys.includes(key) ? '#ff9800' : '#fff', fontWeight: 500, borderBottom: '1px solid #222', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                                                                {key} {existingKeys.includes(key) && <span style={{ color: '#ff9800', fontSize: 12, marginLeft: 6 }}>(will replace)</span>}
                                                            </div>
                                                            <div style={{ padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid #222' }}>
                                                                <Checkbox
                                                                    checked={selectedImportKeys.includes(key)}
                                                                    onChange={e => {
                                                                        if (e.target.checked) {
                                                                            setSelectedImportKeys([...selectedImportKeys, key]);
                                                                        } else {
                                                                            setSelectedImportKeys(selectedImportKeys.filter(k => k !== key));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </Modal>
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default SettingsPage;
