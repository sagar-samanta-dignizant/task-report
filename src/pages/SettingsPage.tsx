/* eslint-disable @typescript-eslint/no-explicit-any */
import { Switch } from "antd";

const SettingsPage = ({ settings, toggleSetting }: any) => (
    <div className="settings-page">
        <h2>Settings</h2>
        <div className="settings-option">
            <label>
                Show Date
                <Switch
                    checked={settings.showDate}
                    onChange={(checked) => toggleSetting("showDate", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Hours
                <Switch
                    checked={settings.showHours}
                    onChange={(checked) => toggleSetting("showHours", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show ID
                <Switch
                    checked={settings.showID}
                    onChange={(checked) => toggleSetting("showID", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Status
                <Switch
                    checked={settings.showStatus}
                    onChange={(checked) => toggleSetting("showStatus", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Next Task
                <Switch
                    checked={settings.showNextTask}
                    onChange={(checked) => toggleSetting("showNextTask", checked)}
                />
            </label>
        </div>
        <div className="settings-option">
            <label>
                Show Project
                <Switch
                    checked={settings.showProject}
                    onChange={(checked) => toggleSetting("showProject", checked)}
                />
            </label>
        </div>
    </div>
);
export default SettingsPage;