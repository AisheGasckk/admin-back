import React from "react";

const cellStyle = {
  border: "1px solid #888",
  padding: "6px 10px",
  fontSize: "15px",
  verticalAlign: "top",
  textAlign: "center"
};
const headerStyle = {
  background: "#e5e7eb",
  fontWeight: "bold",
  fontSize: "18px",
  padding: "8px 10px",
  border: "1px solid #888",
  textAlign: "center"
};
const sectionTitle = {
  background: "#f3f4f6",
  fontWeight: "bold",
  fontSize: "20px",
  padding: "10px 12px",
  border: "1px solid #888",
  textAlign: "left",
  marginBottom: "24px"
};
const captionStyle = {
  captionSide: "top",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "18px",
  padding: "8px 0"
};

function groupBy(arr, key) {
  return arr.reduce((acc, row) => {
    const k = row[key] || "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});
}

const PdfReportTable1 = ({
  departmentEnrollment = [],
  departmentExamination = [],
  teachingStaff = [],
  nonTeachingStaff = [],
  sections = {}
}) => {
  // Group by department
  const enrollmentByDept = groupBy(departmentEnrollment, "department_name");
  const examinationByDept = groupBy(departmentExamination, "department_name");

  return (
    <div style={{ padding: "40px", background: "#fff", width: "700px", minHeight: "1120px", boxSizing: "border-box" }}>
      {/* Department Student Enrollment Section */}
      {sections.enrollment && (
        <div style={{ marginBottom: 32 }}>
          <div style={sectionTitle}>D: Department Student Enrollment</div>
          {Object.keys(enrollmentByDept).length === 0 && (
            <div style={{ padding: "24px", color: "#888", textAlign: "center" }}>No enrollment data found.</div>
          )}
          {Object.entries(enrollmentByDept).map(([dept, rows]) => (
            <table
              key={dept}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "32px",
                background: "#fff"
              }}
            >
              <caption style={{
                captionSide: "top",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "18px",
                padding: "8px 0"
              }}>
                {dept}
              </caption>
              <thead>
                <tr>
                  <th style={headerStyle}>Degree Level</th>
                  <th style={headerStyle}>Year</th>
                  <th style={headerStyle}>Male</th>
                  <th style={headerStyle}>Female</th>
                  <th style={headerStyle}>Transgender</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}>{row.degree_level}</td>
                    <td style={cellStyle}>{row.year}</td>
                    <td style={cellStyle}>{row.male_count}</td>
                    <td style={cellStyle}>{row.female_count}</td>
                    <td style={cellStyle}>{row.transgender_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}

      {/* Department Student Examination Section */}
      {sections.examination && (
        <div style={{ marginBottom: 32 }}>
          <div style={sectionTitle}>E: Department Student Examination</div>
          {Object.keys(examinationByDept).length === 0 && (
            <div style={{ padding: "24px", color: "#888", textAlign: "center" }}>No examination data found.</div>
          )}
          {Object.entries(examinationByDept).map(([dept, rows]) => (
            <table
              key={dept}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "32px",
                background: "#fff"
              }}
            >
              <caption style={captionStyle}>{dept}</caption>
              <thead>
                <tr>
                  <th style={headerStyle}>Degree Level</th>
                  <th style={headerStyle}>Year</th>
                  <th style={headerStyle}>Result Type</th>
                  <th style={headerStyle}>Male</th>
                  <th style={headerStyle}>Female</th>
                  <th style={headerStyle}>Transgender</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}>{row.degree_level}</td>
                    <td style={cellStyle}>{row.year}</td>
                    <td style={cellStyle}>{row.result_type}</td>
                    <td style={cellStyle}>{row.male_count}</td>
                    <td style={cellStyle}>{row.female_count}</td>
                    <td style={cellStyle}>{row.transgender_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}

      {/* Teaching Staff Section (Image-like) */}
      {sections.teaching && teachingStaff.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={sectionTitle}>G: Teaching Staff Details</div>
          {teachingStaff.map((row, idx) => {
            // Reduced cell styles
            const smallCellStyle = { ...cellStyle, padding: "2px 6px", fontSize: "10px" };
            const smallHeaderStyle = { ...headerStyle, padding: "4px 6px", fontSize: "10px" };
            // Helper to format date as YYYY-MM-DD
            const formatDate = (dateStr) => {
              if (!dateStr) return "";
              const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
              return match ? match[0] : "";
            };
            return (
              <table
                key={row.id || idx}
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "24px",
                  background: "#fff"
                }}
              >
                <tbody>
                  <tr>
                    <td style={smallHeaderStyle}>S.No</td>
                    <td style={smallCellStyle}>{idx + 1}</td>
                    <td style={smallHeaderStyle}>Country Name</td>
                    <td style={smallCellStyle}>{row.country_name}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Department/Centre</td>
                    <td style={smallCellStyle}>{row.department}</td>
                    <td style={smallHeaderStyle}>Name of the Employee</td>
                    <td style={smallCellStyle}>{row.name}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Gender</td>
                    <td style={smallCellStyle}>{row.gender}</td>
                    <td style={smallHeaderStyle}>Date of Birth</td>
                    <td style={smallCellStyle}>{formatDate(row.date_of_birth)}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Email</td>
                    <td style={smallCellStyle}>{row.email}</td>
                    <td style={smallHeaderStyle}>Mobile No</td>
                    <td style={smallCellStyle}>{row.mobile_no}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>PAN Number</td>
                    <td style={smallCellStyle}>{row.pan_number}</td>
                    <td style={smallHeaderStyle}>Designation</td>
                    <td style={smallCellStyle}>{row.designation}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Nature of Appointment</td>
                    <td style={smallCellStyle}>{row.nature_of_appointment}</td>
                    <td style={smallHeaderStyle}>Social Category</td>
                    <td style={smallCellStyle}>{row.social_category}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Religious Community</td>
                    <td style={smallCellStyle}>{row.religious_community}</td>
                    <td style={smallHeaderStyle}>PWBD</td>
                    <td style={smallCellStyle}>{row.pwbd_status ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Date of Joining</td>
                    <td style={smallCellStyle}>{formatDate(row.date_of_joining)}</td>
                    <td style={smallHeaderStyle}>Date of Joining Teaching Profession</td>
                    <td style={smallCellStyle}>{formatDate(row.date_of_joining_profession)}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Job Status</td>
                    <td style={smallCellStyle}>{row.job_status}</td>
                    <td style={smallHeaderStyle}>Date of Leaving</td>
                    <td style={smallCellStyle}>{formatDate(row.date_of_leaving)}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Date of Change in Status</td>
                    <td style={smallCellStyle}>{formatDate(row.date_of_status_change)}</td>
                    <td style={smallCellStyle}></td>
                    <td style={smallCellStyle}></td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Highest Qualification</td>
                    <td style={smallCellStyle}>{row.highest_qualification}</td>
                    <td style={smallHeaderStyle}>Programme Name of Highest Qualification</td>
                    <td style={smallCellStyle}>{row.programme_highest_qualification}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Broad Discipline Group Name</td>
                    <td style={smallCellStyle}>{row.broad_discipline_group_name}</td>
                    <td style={smallHeaderStyle}>Broad Discipline Group Category</td>
                    <td style={smallCellStyle}>{row.broad_discipline_group_category}</td>
                  </tr>
                  <tr>
                    <td style={smallHeaderStyle}>Additional/Eligibility Qualification</td>
                    <td style={smallCellStyle}>{Array.isArray(row.additional_qualification) ? row.additional_qualification.join(", ") : row.additional_qualification}</td>
                    <td style={smallHeaderStyle}>Year Spent Exclusively in other than Teaching job</td>
                    <td style={smallCellStyle}>
                      Year {row.year_spent_other_than_teaching} Month {row.month_spent_other_than_teaching}
                    </td>
                  </tr>
                </tbody>
              </table>
            );
          })}
        </div>
      )}

      {/* Non-Teaching Staff Section */}
      {sections.nonTeaching && nonTeachingStaff.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={sectionTitle}>H: Non-Teaching Staff Summary</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px", background: "#fff" }}>
            <thead>
              <tr>
                <th style={headerStyle}>Staff Type</th>
                <th style={headerStyle}>Group</th>
                <th style={headerStyle}>Male</th>
                <th style={headerStyle}>Female</th>
                <th style={headerStyle}>Transgender</th>
                <th style={headerStyle}>Sanctioned Strength</th>
              </tr>
            </thead>
            <tbody>
              {nonTeachingStaff.map((row, idx) => (
                <tr key={idx}>
                  <td style={cellStyle}>{row.staff_type}</td>
                  <td style={cellStyle}>{row.staff_group}</td>
                  <td style={cellStyle}>{row.male_count}</td>
                  <td style={cellStyle}>{row.female_count}</td>
                  <td style={cellStyle}>{row.transgender_count}</td>
                  <td style={cellStyle}>{row.sanctioned_strength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PdfReportTable1;