/* eslint-disable @typescript-eslint/no-explicit-any */
import "./SettingsPage.css"; // Import custom CSS for the switch

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
        <h2>Settings</h2>
        <div className="settings-option">
            <label>
                Show Date
                <CustomSwitch
                    checked={settings.showDate}
                    onChange={(checked) => toggleSetting("showDate", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Hours
                <CustomSwitch
                    checked={settings.showHours}
                    onChange={(checked) => toggleSetting("showHours", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show ID
                <CustomSwitch
                    checked={settings.showID}
                    onChange={(checked) => toggleSetting("showID", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Status
                <CustomSwitch
                    checked={settings.showStatus}
                    onChange={(checked) => toggleSetting("showStatus", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Next Task
                <CustomSwitch
                    checked={settings.showNextTask}
                    onChange={(checked) => toggleSetting("showNextTask", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Project
                <CustomSwitch
                    checked={settings.showProject}
                    onChange={(checked) => toggleSetting("showProject", checked)}
                />
            </label>
        </div>
    </div>
);
export default SettingsPage;