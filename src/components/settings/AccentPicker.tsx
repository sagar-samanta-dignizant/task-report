import { ColorPicker, Button, Tooltip } from "antd";
import type { Color } from "antd/es/color-picker";
import { UndoOutlined } from "@ant-design/icons";
import { useTheme, ACCENT_PRESETS, buildCustomPalette } from "../../theme/ThemeContext";
import "./AccentPicker.css";

export const AccentPicker = () => {
  const { accent, setAccent, resetAccent } = useTheme();

  return (
    <div className="accent-picker">
      <div className="accent-swatches">
        {ACCENT_PRESETS.map((p) => (
          <Tooltip key={p.name} title={p.name} mouseEnterDelay={0.2}>
            <button
              type="button"
              className={`accent-swatch ${accent.color.toLowerCase() === p.color.toLowerCase() ? "active" : ""}`}
              onClick={() => setAccent(p)}
              aria-label={`Use ${p.name} accent`}
              style={{ background: p.gradient }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="accent-custom">
        <ColorPicker
          value={accent.color}
          onChange={(c: Color) => setAccent(buildCustomPalette(c.toHexString()))}
          showText
          format="hex"
          presets={[
            {
              label: "Recent",
              colors: ACCENT_PRESETS.map((p) => p.color),
            },
          ]}
        />
        <Tooltip title="Reset to Violet">
          <Button icon={<UndoOutlined />} onClick={resetAccent} />
        </Tooltip>
      </div>
    </div>
  );
};

export default AccentPicker;
