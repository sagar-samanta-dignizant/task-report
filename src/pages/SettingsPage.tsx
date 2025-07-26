import "./SettingsPage.css"; // Import custom CSS for the settings page

import { Avatar, Button, Input, Upload, message, List, Popconfirm, Tabs } from "antd"; // Import Ant Design Input, Upload, Button, Avatar, message, List, Popconfirm, and Tabs components

import React from "react";
import { UploadOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons"; // Import Upload, Plus, and Delete icons

const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <div
        className={`custom-switch ${checked ? "checked" : ""}`}
        onClick={() => onChange(!checked)}
    >
        <div className="switch-handle" />
    </div>
);

const DEFAULT_PROJECTS = ["Rukkor", "Geometra", "Deviaq", "Rukkor website"];

const SettingsPage = ({ settings, toggleSetting, setProfilePicture }: any) => {
    const [uploadedImage, setUploadedImage] = React.useState<string | null>(null); // State for uploaded image preview
    const [projectInput, setProjectInput] = React.useState("");
    const [projects, setProjects] = React.useState<string[]>(() => {
        const stored = localStorage.getItem("allProjects");
        return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
    });
    const generateSettings = JSON.parse(localStorage.getItem("generateSettings") || "{}");

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

    const handleRemoveProject = (project: string) => {
        if (DEFAULT_PROJECTS.includes(project)) {
            message.error("Default projects cannot be removed.");
            return;
        }
        updateProjects(projects.filter((p) => p !== project));
    };

    return (
        <div className="settings-page">
            <h2 className="settings-title">Settings</h2>
            <div className="settings-container">
                <Tabs defaultActiveKey="projects" type="card" size="large" className="settings-tabs">
                    <Tabs.TabPane tab="Project Options" key="projects">
                        {/* Project Management Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Project Options</h3>
                            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
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
                            <List
                                grid={{ gutter: 16, column: 2 }}
                                bordered={false}
                                dataSource={projects}
                                renderItem={item => (
                                    <List.Item style={{ background: 'linear-gradient(135deg, #23272f 60%, #181b20 100%)', borderRadius: 10, margin: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', border: '1px solid #23272f' }}>
                                        <span style={{
                                            fontWeight: DEFAULT_PROJECTS.includes(item) ? 700 : 400,
                                            color: DEFAULT_PROJECTS.includes(item) ? "#43a047" : "#e0e0e0",
                                            fontSize: 16
                                        }}>
                                            {item}
                                            {DEFAULT_PROJECTS.includes(item) && <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>(default)</span>}
                                        </span>
                                        {!DEFAULT_PROJECTS.includes(item) && (
                                            <Popconfirm
                                                title="Remove this project?"
                                                onConfirm={() => handleRemoveProject(item)}
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <Button
                                                    type="primary"
                                                    icon={<DeleteOutlined style={{ transition: 'color 0.2s' }} />}
                                                    danger
                                                    size="small"
                                                    style={{
                                                        marginLeft: 8,
                                                        background: 'linear-gradient(135deg, #23272f 60%, #181b20 100%)',
                                                        color: '#ff5252',
                                                        border: '1px solid #444',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                                                        transition: 'color 0.2s, background 0.2s',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.color = '#fff';
                                                        e.currentTarget.style.background = '#ff5252';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.color = '#ff5252';
                                                        e.currentTarget.style.background = 'linear-gradient(135deg, #23272f 60%, #181b20 100%)';
                                                    }}
                                                />
                                            </Popconfirm>
                                        )}
                                    </List.Item>
                                )}
                                style={{ maxWidth: 700, width: '100%', background: 'transparent', color: '#fff', marginTop: 8 }}
                            />
                        </div>
                    </Tabs.TabPane>
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
                            <div className="settings-option">
                                <label>
                                    Show ID
                                    <CustomSwitch
                                        checked={settings.previewSettings.showID}
                                        onChange={(checked) => toggleSetting("previewSettings", "showID", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Date
                                    <CustomSwitch
                                        checked={settings.previewSettings.showDate}
                                        onChange={(checked) => toggleSetting("previewSettings", "showDate", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Project
                                    <CustomSwitch
                                        checked={settings.previewSettings.showProject}
                                        onChange={(checked) => toggleSetting("previewSettings", "showProject", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Status
                                    <CustomSwitch
                                        checked={settings.previewSettings.showStatus}
                                        onChange={(checked) => toggleSetting("previewSettings", "showStatus", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Hours
                                    <CustomSwitch
                                        checked={settings.previewSettings.showHours}
                                        onChange={(checked) => toggleSetting("previewSettings", "showHours", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Show Next Task
                                    <CustomSwitch
                                        checked={settings.previewSettings.showNextTask}
                                        onChange={(checked) => toggleSetting("previewSettings", "showNextTask", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Subtask
                                    <CustomSwitch
                                        checked={settings.previewSettings.allowSubtask}
                                        onChange={(checked) => toggleSetting("previewSettings", "allowSubtask", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Hide Parent Task Hours/Minutes (if Subtasks Exist)
                                    <CustomSwitch
                                        checked={settings.previewSettings.hideParentTaskTime}
                                        onChange={(checked) => toggleSetting("previewSettings", "hideParentTaskTime", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Hide Parent Task Status (if Subtasks Exist)
                                    <CustomSwitch
                                        checked={settings.previewSettings.hideParentTaskStatus}
                                        onChange={(checked) => toggleSetting("previewSettings", "hideParentTaskStatus", checked)}
                                    />
                                </label>
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Line After "Work Update Text"
                                    <CustomSwitch
                                        checked={settings.previewSettings.allowLineAfterWorkUpdate}
                                        onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterWorkUpdate", checked)}
                                    />
                                </label>
                                {settings.previewSettings.allowLineAfterWorkUpdate && (
                                    <Input
                                        type="number"
                                        className="line-input"
                                        placeholder="Enter line length"
                                        value={settings.previewSettings.lineAfterWorkUpdate || 3}
                                        onChange={(e) =>
                                            toggleSetting("previewSettings", "lineAfterWorkUpdate", parseInt(e.target.value) || 3)
                                        }
                                        onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                    />
                                )}
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Line After "Project"
                                    <CustomSwitch
                                        checked={settings.previewSettings.allowLineAfterProject}
                                        onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterProject", checked)}
                                    />
                                </label>
                                {settings.previewSettings.allowLineAfterProject && (
                                    <Input
                                        type="number"
                                        className="line-input"
                                        placeholder="Enter line length"
                                        value={settings.previewSettings.lineAfterProject || 3}
                                        onChange={(e) =>
                                            toggleSetting("previewSettings", "lineAfterProject", parseInt(e.target.value) || 3)
                                        }
                                        onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                    />
                                )}
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Line After "Next Task"
                                    <CustomSwitch
                                        checked={settings.previewSettings.allowLineAfterNextTask}
                                        onChange={(checked) => toggleSetting("previewSettings", "allowLineAfterNextTask", checked)}
                                    />
                                </label>
                                {settings.previewSettings.allowLineAfterNextTask && (
                                    <Input
                                        type="number"
                                        className="line-input"
                                        placeholder="Enter line length"
                                        value={settings.previewSettings.lineAfterNextTask || 3}
                                        onChange={(e) =>
                                            toggleSetting("previewSettings", "lineAfterNextTask", parseInt(e.target.value) || 3)
                                        }
                                        onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                    />
                                )}
                            </div>
                            <div className="settings-option">
                                <label>
                                    Allow Line Before "Closing Text"
                                    <CustomSwitch
                                        checked={settings.previewSettings.allowLineBeforeClosingText}
                                        onChange={(checked) => toggleSetting("previewSettings", "allowLineBeforeClosingText", checked)}
                                    />
                                </label>
                                {settings.previewSettings.allowLineBeforeClosingText && (
                                    <Input
                                        type="number"
                                        className="line-input"
                                        placeholder="Enter line length"
                                        value={settings.previewSettings.lineBeforeClosingText || 3}
                                        onChange={(e) =>
                                            toggleSetting("previewSettings", "lineBeforeClosingText", parseInt(e.target.value) || 3)
                                        }
                                        onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                    />
                                )}
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
                    <Tabs.TabPane tab="Generate Settings" key="generate">
                        {/* Generate Settings Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Generate Settings</h3>
                            <div className="settings-option">
                                <label>
                                    Task Gap
                                    <input
                                        type="number"
                                        className="gap-input"
                                        value={settings.generateSettings.taskGap || 1} // Default to 1 if not set
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
                                        value={settings.generateSettings.subtaskGap || 1} // Default to 1 if not set
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
                                                return false; // Reject unsupported file types
                                            }
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const result = reader.result as string;
                                                try {
                                                    localStorage.setItem("profilePicture", result); // Attempt to store the image
                                                    setUploadedImage(result); // Set preview image
                                                    setProfilePicture(result); // Update profile picture
                                                } catch (error) {
                                                    if (error instanceof DOMException && error.name === "QuotaExceededError") {
                                                        message.error("Image is too large to store in localStorage.");
                                                    } else {
                                                        console.error("Failed to store image:", error);
                                                    }
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                            return false; // Prevent automatic upload
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
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    );  
};

export default SettingsPage;