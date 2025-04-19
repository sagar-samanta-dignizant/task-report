import "./SettingsPage.css"; // Import custom CSS for the settings page

const CustomSwitch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <div
        className={`custom-switch ${checked ? "checked" : ""}`}
        onClick={() => onChange(!checked)}
    >
        <div className="switch-handle" />
    </div>
);

const SettingsPage = ({ settings, toggleSetting }: any) => (
    <div className="settings-page">
        <h2 className="settings-title">Settings</h2>
        <div className="settings-container">
            {/* Task Settings Section */}
            <div className="settings-section">
                <h3 className="settings-section-title">Task Settings</h3>
                <div className="settings-option">
                    <label>
                        Allow Subtask
                        <CustomSwitch
                            checked={settings.taskSettings.allowSubtask}
                            onChange={(checked) => toggleSetting("taskSettings", "allowSubtask", checked)}
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
                        Show Status
                        <CustomSwitch
                            checked={settings.taskSettings.showStatus}
                            onChange={(checked) => toggleSetting("taskSettings", "showStatus", checked)}
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
                        Show ID
                        <CustomSwitch
                            checked={settings.taskSettings.showID}
                            onChange={(checked) => toggleSetting("taskSettings", "showID", checked)}
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
                        Show Project
                        <CustomSwitch
                            checked={settings.taskSettings.showProject}
                            onChange={(checked) => toggleSetting("taskSettings", "showProject", checked)}
                        />
                    </label>
                </div>
            </div>

            {/* Preview Settings Section */}
            <div className="settings-section">
                <h3 className="settings-section-title">Preview Settings</h3>
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
                        Show Hours
                        <CustomSwitch
                            checked={settings.previewSettings.showHours}
                            onChange={(checked) => toggleSetting("previewSettings", "showHours", checked)}
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
                        Show Date
                        <CustomSwitch
                            checked={settings.previewSettings.showDate}
                            onChange={(checked) => toggleSetting("previewSettings", "showDate", checked)}
                        />
                    </label>
                </div>
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
                        Show Next Task
                        <CustomSwitch
                            checked={settings.previewSettings.showNextTask}
                            onChange={(checked) => toggleSetting("previewSettings", "showNextTask", checked)}
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
            </div>

            {/* Export Settings Section */}
            <div className="settings-section">
                <h3 className="settings-section-title">Export Settings</h3>
                <div className="settings-option">
                    <label>
                        Allow Subtask
                        <CustomSwitch
                            checked={settings.exportSettings.allowSubtask}
                            onChange={(checked) => toggleSetting("exportSettings", "allowSubtask", checked)}
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
                        Show Status
                        <CustomSwitch
                            checked={settings.exportSettings.showStatus}
                            onChange={(checked) => toggleSetting("exportSettings", "showStatus", checked)}
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
                        Show ID
                        <CustomSwitch
                            checked={settings.exportSettings.showID}
                            onChange={(checked) => toggleSetting("exportSettings", "showID", checked)}
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
                        Show Project
                        <CustomSwitch
                            checked={settings.exportSettings.showProject}
                            onChange={(checked) => toggleSetting("exportSettings", "showProject", checked)}
                        />
                    </label>
                </div>
            </div>
        </div>
    </div>
);

export default SettingsPage;