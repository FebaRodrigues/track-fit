//src/components/Trainer/TrainerProfile.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getTrainerById, updateTrainerProfile } from "../../api";
import Footer from "../Footer";
import "../../styles/TrainerStyle.css";
import "../../styles/TrainerProfile.css";

const TrainerProfile = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialties: "",
    phone: "",
    bio: "",
    image: null,
    availability: [{ day: "", startTime: "", endTime: "" }],
    certifications: [{ name: "", issuer: "", year: "" }],
    experience: [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      setLoading(true);
      try {
        const response = await getTrainerById(trainerId);
        console.log("Initial fetch or refetch:", response.data);
        setTrainer(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          specialties: response.data.specialties.join(", "),
          phone: response.data.phone || "",
          bio: response.data.bio || "",
          image: null,
          availability: response.data.availability || [{ day: "", startTime: "", endTime: "" }],
          certifications: response.data.certifications || [{ name: "", issuer: "", year: "" }],
          experience: response.data.experience || [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
        });
        setPreviewImage(response.data.image);
      } catch (err) {
        setError("Failed to fetch trainer profile.");
      } finally {
        setLoading(false);
      }
    };

    if (trainerId) fetchTrainerProfile();
  }, [trainerId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...formData.availability];
    newAvailability[index][field] = value;
    setFormData({ ...formData, availability: newAvailability });
  };

  const addAvailabilitySlot = () => {
    setFormData({
      ...formData,
      availability: [...formData.availability, { day: "", startTime: "", endTime: "" }],
    });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: "", issuer: "", year: "" }]
    });
  };

  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index][field] = value;
    setFormData({ ...formData, certifications: newCertifications });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { position: "", organization: "", startYear: "", endYear: "", description: "" }]
    });
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.experience];
    newExperience[index][field] = value;
    setFormData({ ...formData, experience: newExperience });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const updatedData = new FormData();
    console.log("current form data state", formData);
    updatedData.set("name", formData.name);
    updatedData.set("email", formData.email);

    const specialtiesArray = formData.specialties.split(",").map((s) => s.trim());
    specialtiesArray.forEach((specialty) => updatedData.append("specialties[]", specialty));

    updatedData.append("phone", formData.phone);
    updatedData.append("bio", formData.bio);
    if (formData.image) updatedData.append("image", formData.image);
    updatedData.append("availability", JSON.stringify(formData.availability));
    updatedData.append("certifications", JSON.stringify(formData.certifications));
    updatedData.append("experience", JSON.stringify(formData.experience));

    try {
      console.log("updated data", updatedData);
      for (let [key, value] of updatedData.entries()) console.log(`${key}: ${value}`);

      const response = await updateTrainerProfile(trainerId, updatedData);
      console.log("Update response:", response.data);

      alert("Profile updated successfully!");
      setIsEditing(false);
      setPreviewImage(null); // Reset preview after successful update

      const updatedProfileResponse = await getTrainerById(trainerId);
      console.log("Fetched updated profile:", updatedProfileResponse.data);
      setTrainer(updatedProfileResponse.data);
      setFormData({
        name: updatedProfileResponse.data.name,
        email: updatedProfileResponse.data.email,
        specialties: updatedProfileResponse.data.specialties.join(", "),
        phone: updatedProfileResponse.data.phone || "",
        bio: updatedProfileResponse.data.bio || "",
        image: null,
        availability: updatedProfileResponse.data.availability || [{ day: "", startTime: "", endTime: "" }],
        certifications: updatedProfileResponse.data.certifications || [{ name: "", issuer: "", year: "" }],
        experience: updatedProfileResponse.data.experience || [{ position: "", organization: "", startYear: "", endYear: "", description: "" }]
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="trainer-profile-container">
      <h2>{isEditing ? "Edit Profile" : `${trainer.name}'s Profile`}</h2>
      <div className="image-container">
        <img
          src={previewImage || trainer.image}
          alt={`${trainer.name}'s profile`}
          className="trainer-profile-image"
        />
      </div>
      <form onSubmit={handleUpdateProfile}>
        <label>Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          disabled={!isEditing}
        />
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          disabled={!isEditing}
        />
        <label>Specialties</label>
        <input
          type="text"
          name="specialties"
          value={formData.specialties}
          onChange={handleInputChange}
          required
          disabled={!isEditing}
        />
        <label>Phone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        <label>Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        {/* Show Profile Image field only in edit mode */}
        {isEditing && (
          <>
            <label>Profile Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </>
        )}

        {/* Display Availability in Both View and Edit Modes */}
        <label>Availability</label>
        {formData.availability && formData.availability.length > 0 ? (
          formData.availability.map((slot, index) =>
            isEditing ? (
              <div key={index} className="availability-slot">
                <select
                  value={slot.day}
                  onChange={(e) => handleAvailabilityChange(index, "day", e.target.value)}
                >
                  <option value="">Select Day</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => handleAvailabilityChange(index, "startTime", e.target.value)}
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => handleAvailabilityChange(index, "endTime", e.target.value)}
                />
              </div>
            ) : (
              <div key={index} className="availability-slot">
                <p>
                  {slot.day}: {slot.startTime} - {slot.endTime}
                </p>
              </div>
            )
          )
        ) : (
          <p>No availability set</p>
        )}
        {isEditing && (
          <button type="button" onClick={addAvailabilitySlot}>
            Add Slot
          </button>
        )}

        {/* Display Certifications */}
        <label>Certifications</label>
        {formData.certifications && formData.certifications.length > 0 ? (
          isEditing ? (
            formData.certifications.map((cert, index) => (
              <div key={index} className="certification-slot">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={(e) => handleCertificationChange(index, "name", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Issuing Organization"
                  value={cert.issuer}
                  onChange={(e) => handleCertificationChange(index, "issuer", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={cert.year}
                  onChange={(e) => handleCertificationChange(index, "year", e.target.value)}
                />
              </div>
            ))
          ) : (
            <div className="certifications-list">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="certification-item">
                  <p><strong>{cert.name}</strong> - {cert.issuer} ({cert.year})</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <p>No certifications added yet</p>
        )}
        {isEditing && (
          <button type="button" onClick={addCertification}>
            Add Certification
          </button>
        )}

        {/* Display Experience */}
        <label>Experience</label>
        {formData.experience && formData.experience.length > 0 ? (
          isEditing ? (
            formData.experience.map((exp, index) => (
              <div key={index} className="experience-slot">
                <input
                  type="text"
                  placeholder="Position"
                  value={exp.position}
                  onChange={(e) => handleExperienceChange(index, "position", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Organization"
                  value={exp.organization}
                  onChange={(e) => handleExperienceChange(index, "organization", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Start Year"
                  value={exp.startYear}
                  onChange={(e) => handleExperienceChange(index, "startYear", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="End Year"
                  value={exp.endYear}
                  onChange={(e) => handleExperienceChange(index, "endYear", e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={exp.description}
                  onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                />
              </div>
            ))
          ) : (
            <div className="experience-list">
              {formData.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <h4>{exp.position} at {exp.organization}</h4>
                  <p>{exp.startYear} - {exp.endYear || 'Present'}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <p>No experience added yet</p>
        )}
        {isEditing && (
          <button type="button" onClick={addExperience}>
            Add Experience
          </button>
        )}

        {isEditing ? (
          <>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </form>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>

    </div>
  );
};

export default TrainerProfile;
