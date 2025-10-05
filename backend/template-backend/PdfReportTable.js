import React from "react";
import PdfReportTable1 from "./PdfReportTable1";

const cellStyle = {
  border: "1px solid #888",
  padding: "6px 10px",
  fontSize: "15px",
  verticalAlign: "top"
};
const headerStyle = {
  background: "#e5e7eb",
  fontWeight: "bold",
  fontSize: "18px",
  padding: "8px 10px",
  border: "1px solid #888"
};
const sectionTitle = {
  background: "#f3f4f6",
  fontWeight: "bold",
  fontSize: "20px",
  padding: "10px 12px",
  border: "1px solid #888",
  textAlign: "left"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "20px",
  pageBreakInside: "avoid", // Prevent table splitting across pages
  fontSize: "12px" // Smaller font for better fit
};

const PdfReportTable = ({
  basicInfo,
  officeDetails,
  addressDetails,
  departmentEnrollment = [],
  departmentExamination = [],
  teachingStaff = [],
  nonTeachingStaff = [],
  sections = { basic: true, office: true, address: true, enrollment: true, examination: true },
  selectedAcademicYear
}) => (
  <div style={{ 
  padding: "40px", 
  background: "#fff", 
  width: "100%", 
  minHeight: "1120px", 
  boxSizing: "border-box",
  maxWidth: "1120px",
  margin: "0 auto"
}}>
    {/* Custom Heading and Subheading */}
    <h1 style={{ textAlign: "center", fontWeight: "bold", fontSize: "2rem", marginBottom: "8px", color: "#1e293b" }}>
      GOVERNMENT ARTS AND SCIENCE COLLEGE, PALKULAM KANYAKUMARI - 629 401
    </h1>
    <h2 style={{ textAlign: "center", fontWeight: "bold", fontSize: "1.3rem", marginBottom: "24px", color: "#334155" }}>
      GASCKK AISHE REPORT
    </h2>
    <div style={{ marginBottom: "24px", textAlign: "center", fontWeight: "bold", fontSize: "22px", color: "#1e293b" }}>
      Academic Year: {selectedAcademicYear || "All"}
    </div>
    {/* Basic Details Section */}
    {sections.basic && basicInfo && (
      <table style={tableStyle}>
        <thead>
          <tr><td colSpan={2} style={sectionTitle}>A: Basic Details</td></tr>
        </thead>
        <tbody>
          <tr><td style={cellStyle}>AISHE Code</td><td style={cellStyle}>{basicInfo.aishe_code}</td></tr>
          <tr><td style={cellStyle}>Name of the Institution</td><td style={cellStyle}>{basicInfo.institution_name}</td></tr>
          <tr><td style={cellStyle}>Year of Establishment</td><td style={cellStyle}>{basicInfo.year_of_establishment}</td></tr>
          <tr><td style={cellStyle}>Status Prior to Establishment, if applicable</td><td style={cellStyle}>{basicInfo.status_prior_establishment}</td></tr>
          <tr><td style={cellStyle}>Name of University to Which affiliated</td><td style={cellStyle}>{basicInfo.university_name}</td></tr>
          <tr><td style={cellStyle}>Year of Affiliation with University</td><td style={cellStyle}>{basicInfo.year_of_affiliation}</td></tr>
          <tr><td style={cellStyle}>Name of the statutory Body through which Recognized</td><td style={cellStyle}>{basicInfo.statutory_body}</td></tr>
          <tr><td style={cellStyle}>Is the institution affiliated with any other University/Statutory</td><td style={cellStyle}>{basicInfo.affiliated_other_university === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Type of Institution</td><td style={cellStyle}>{basicInfo.type_of_institution}</td></tr>
          <tr><td style={cellStyle}>Ownership status of Institution</td><td style={cellStyle}>{basicInfo.ownership_status}</td></tr>
          <tr><td style={cellStyle}>Management of Institution</td><td style={cellStyle}>{basicInfo.management_of_institution}</td></tr>
          <tr><td style={cellStyle}>Name of the Trust / Society/ Company/ Others</td><td style={cellStyle}>{basicInfo.trust_name}</td></tr>
          <tr><td style={cellStyle}>Address of the Trust / Society/ Company/ Others</td><td style={cellStyle}>{basicInfo.trust_address}</td></tr>
          <tr><td style={cellStyle}>Is it evening college</td><td style={cellStyle}>{basicInfo.evening_college === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Exclusively for specific group?</td><td style={cellStyle}>{basicInfo.exclusive_group === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Autonomous Institute</td><td style={cellStyle}>{basicInfo.autonomous_institute === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Minority Managed Institution</td><td style={cellStyle}>{basicInfo.minority_managed === 1 ? "Yes" : "No"}</td></tr>
          {basicInfo.minority_managed === 1 && (
            <tr><td style={cellStyle}>Type of minority community managing the institution</td><td style={cellStyle}>{basicInfo.minority_type}</td></tr>
          )}
        </tbody>
      </table>
    )}

    {/* NCC Section */}
    {sections.basic && (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr><td colSpan={4} style={headerStyle}>Number of Students Enrolled In NCC</td></tr>
          <tr>
            <td style={cellStyle}></td>
            <td style={cellStyle}>Male</td>
            <td style={cellStyle}>Female</td>
            <td style={cellStyle}>Total</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>Number of students in NCC from your institution</td>
            <td style={cellStyle}>{basicInfo.ncc_male}</td>
            <td style={cellStyle}>{basicInfo.ncc_female}</td>
            <td style={cellStyle}>{basicInfo.ncc_total}</td>
          </tr>
          <tr>
            <td style={cellStyle}>Number of students in NCC from other institutions</td>
            <td style={cellStyle}>{basicInfo.ncc_other_male}</td>
            <td style={cellStyle}>{basicInfo.ncc_other_female}</td>
            <td style={cellStyle}>{basicInfo.ncc_other_total}</td>
          </tr>
        </tbody>
      </table>
    )}

    {/* NSS Section */}
    {sections.basic && (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr><td colSpan={4} style={headerStyle}>Number of Students Enrolled In NSS</td></tr>
          <tr>
            <td style={cellStyle}></td>
            <td style={cellStyle}>Male</td>
            <td style={cellStyle}>Female</td>
            <td style={cellStyle}>Total</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>Number of Students Enrolled In NSS</td>
            <td style={cellStyle}>{basicInfo.nss_male}</td>
            <td style={cellStyle}>{basicInfo.nss_female}</td>
            <td style={cellStyle}>{basicInfo.nss_total}</td>
          </tr>
        </tbody>
      </table>
    )}

    {/* Other Basic Info */}
    {sections.basic && (
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <tbody>
          <tr><td style={cellStyle}>Whether the institution has conducted any computer-based tests</td><td style={cellStyle}>{basicInfo.computer_based_tests === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Whether your institution has implemented NEP guidelines</td><td style={cellStyle}>{basicInfo.nep_guidelines === 1 ? "Yes" : "No"}</td></tr>
          <tr><td style={cellStyle}>Disciplines in which programme is offered</td><td style={cellStyle}>{basicInfo.discipline}</td></tr>
          <tr><td style={cellStyle}>Is the college running only diploma level course(s)</td><td style={cellStyle}>{basicInfo.only_diploma_courses === 1 ? "Yes" : "No"}</td></tr>
        </tbody>
      </table>
    )}

    {/* Office Details Section */}
    {sections.office && officeDetails && (
      <table style={tableStyle}>
        <thead>
          <tr><td colSpan={2} style={sectionTitle}>B: Officers Details</td></tr>
        </thead>
        <tbody>
          <tr><td style={cellStyle}>Name of Vice chancellor/Director/Head/Principal</td><td style={cellStyle}>{officeDetails.head_name}</td></tr>
          <tr><td style={cellStyle}>Designation</td><td style={cellStyle}>{officeDetails.head_designation}</td></tr>
          <tr><td style={cellStyle}>Mobile No</td><td style={cellStyle}>{officeDetails.head_mobile}</td></tr>
          <tr><td style={cellStyle}>Email</td><td style={cellStyle}>{officeDetails.head_email}</td></tr>
          <tr><td style={cellStyle}>Telephone No (with STD Code)</td><td style={cellStyle}>{officeDetails.head_phone}</td></tr>
          <tr><td style={cellStyle}>Name of Nodal Officer for AISHE</td><td style={cellStyle}>{officeDetails.nodal_name}</td></tr>
          <tr><td style={cellStyle}>Designation</td><td style={cellStyle}>{officeDetails.nodal_designation}</td></tr>
          <tr><td style={cellStyle}>Mobile No</td><td style={cellStyle}>{officeDetails.nodal_mobile}</td></tr>
          <tr><td style={cellStyle}>Email</td><td style={cellStyle}>{officeDetails.nodal_email}</td></tr>
          <tr><td style={cellStyle}>Telephone No (with STD Code)</td><td style={cellStyle}>{officeDetails.nodal_phone}</td></tr>
        </tbody>
      </table>
    )}

    {/* Address Details Section */}
    {sections.address && addressDetails && (
      <table style={tableStyle}>
        <thead>
          <tr><td colSpan={2} style={sectionTitle}>C: Address</td></tr>
        </thead>
        <tbody>
          <tr><td style={cellStyle}>Location of the Institution</td><td style={cellStyle}>{addressDetails.location_type}</td></tr>
          <tr><td style={cellStyle}>Address Line1</td><td style={cellStyle}>{addressDetails.address_line1}</td></tr>
          <tr><td style={cellStyle}>Address Line2</td><td style={cellStyle}>{addressDetails.address_line2}</td></tr>
          <tr><td style={cellStyle}>City</td><td style={cellStyle}>{addressDetails.city}</td></tr>
          <tr><td style={cellStyle}>Country</td><td style={cellStyle}>{addressDetails.country}</td></tr>
          <tr><td style={cellStyle}>State</td><td style={cellStyle}>{addressDetails.state}</td></tr>
          <tr><td style={cellStyle}>District</td><td style={cellStyle}>{addressDetails.district}</td></tr>
          <tr><td style={cellStyle}>Subdistrict</td><td style={cellStyle}>{addressDetails.sub_district}</td></tr>
          <tr><td style={cellStyle}>Block / Urban Local Body</td><td style={cellStyle}>{addressDetails.block_ulb}</td></tr>
          <tr><td style={cellStyle}>Pin Code</td><td style={cellStyle}>{addressDetails.pincode}</td></tr>
          <tr><td style={cellStyle}>Longitude (in degree)</td><td style={cellStyle}>{addressDetails.longitude}</td></tr>
          <tr><td style={cellStyle}>Latitude (in degree)</td><td style={cellStyle}>{addressDetails.latitude}</td></tr>
          <tr><td style={cellStyle}>Total Area (in acre)</td><td style={cellStyle}>{addressDetails.total_area_acre}</td></tr>
          <tr><td style={cellStyle}>Total Constructed Area (in sq.m)</td><td style={cellStyle}>{addressDetails.constructed_area_sqm}</td></tr>
          <tr><td style={cellStyle}>Website</td><td style={cellStyle}>{addressDetails.website_url}</td></tr>
        </tbody>
      </table>
    )}

    {/* Student Enrollment & Examination Sections */}
    {(sections.enrollment || sections.examination || sections.teaching || sections.nonTeaching) && (
      <PdfReportTable1
        departmentEnrollment={sections.enrollment ? departmentEnrollment : []}
        departmentExamination={sections.examination ? departmentExamination : []}
        teachingStaff={sections.teaching ? teachingStaff : []}
        nonTeachingStaff={sections.nonTeaching ? nonTeachingStaff : []}
        basicInfo={basicInfo}
        officeDetails={officeDetails}
        addressDetails={addressDetails}
        sections={sections}
      />
    )}
  </div>
);

export default PdfReportTable;
