import "./SettingsPage.css"; // Import custom CSS for the settings page
import { Input, Upload, Button } from "antd"; // Import Ant Design Input, Upload, and Button components
import { UploadOutlined } from "@ant-design/icons"; // Import Upload icon

const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <div
        className={`custom-switch ${checked ? "checked" : ""}`}
        onClick={() => onChange(!checked)}
    >
        <div className="switch-handle" />
    </div>
);

const SettingsPage = ({ settings, toggleSetting, setProfilePicture }: any) => {
    const generateSettings = JSON.parse(localStorage.getItem("generateSettings") || "{}");

    return (
        <div className="settings-page">
            <h2 className="settings-title">Settings</h2>
            <div className="settings-container">              

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
                </div>

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
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        setProfilePicture(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                    return false; // Prevent automatic upload
                                }}
                            >
                                <Button icon={<UploadOutlined />}>Upload</Button>
                            </Upload>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;