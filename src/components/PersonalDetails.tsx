/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input, DatePicker, Select } from "antd";
import moment from "moment";

const { Option } = Select;

interface PersonalDetailsProps {
  name: string;
  setName: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  selectedProjects: string[];
  setSelectedProjects: (value: string[]) => void;
  bulletType: "number" | "dot" | ">" | ">>" | "=>" | "bullet";
  setBulletType: React.Dispatch<
    React.SetStateAction<"number" | "dot" | ">" | ">>" | "=>" | "bullet">
  >;
  ALL_AVAILABLE_PROJECTS: string[];
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  name,
  setName,
  date,
  setDate,
  selectedProjects,
  setSelectedProjects,
  bulletType,
  setBulletType,
  ALL_AVAILABLE_PROJECTS,
}) => {
  return (
    <div className="personal-details-section">
      <h4>Personal Details</h4>
      <div className="task-info-row">
        <div className="input-group">
          <label htmlFor="name">User Name</label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="date">Date</label>
          <DatePicker
            id="date"
            value={date ? moment(date, "YYYY-MM-DD") : null}
            format="YYYY-MM-DD"
            onChange={(_, dateString) => setDate(dateString as string)}
            style={{ width: "100%" }}
          />
        </div>
        <div className="input-group">
          <label htmlFor="project">Project</label>
          <Select
            id="project"
            mode="multiple"
            placeholder="Select project(s)"
            value={selectedProjects}
            onChange={(value) => setSelectedProjects(value)}
            style={{ width: "100%" }}
          >
            {ALL_AVAILABLE_PROJECTS.map((project) => (
              <Option key={project} value={project}>
                {project}
              </Option>
            ))}
          </Select>
        </div>
        <div className="input-group" style={{ position: "relative" }}>
          <label htmlFor="bulletType">Options</label>
          <Select
            id="bulletType"
            value={bulletType}
            onChange={(value) =>
              setBulletType(value as "number" | "dot" | ">" | ">>" | "=>" | "bullet")
            }
            style={{ width: "100%" }}
          >
            <Option value="bullet">•</Option>
            <Option value="number">1</Option>
            <Option value={">"}>{">"}</Option>
            <Option value={"=>"}>{"=>"}</Option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
