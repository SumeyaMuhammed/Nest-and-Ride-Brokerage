import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import classes from './AddHouse.module.css';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Layout from '../../../components/Layout/Layout';

const baseURL = axiosInstance.defaults.baseURL;

const ManageHouse = () => {
  const [houses, setHouses] = useState([]);
  const [brokers, setBrokers] = useState([]); 
  const [newHouse, setNewHouse] = useState({
    title: '',
    description: '',
    price: '',
    num_bedrooms: '',
    num_bathrooms: '',
    area_sqft: '',
    location: '',
    image_url: '',
    name: '', // Store the selected broker's ID
  });
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingHouseId, setEditingHouseId] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [housesResponse, brokersResponse] = await Promise.all([
          axiosInstance.get('/houses'),
          axiosInstance.get('/brokers') // Fetch brokers from the API
        ]);

        const availableBrokers = brokersResponse.data.filter(broker => broker.status === 'available');
        setHouses(Array.isArray(housesResponse.data) ? housesResponse.data : []);
        // setHouses(housesResponse);
        setBrokers(availableBrokers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHouse({
      ...newHouse,
      [name]: value,
    });
  };

  const handleAddHouse = async (e) => {
    e.preventDefault();

    if (!newHouse.title) {
      setMessage('Error: House title is required.');
      return;
    }
    if (!newHouse.price || isNaN(newHouse.price) || newHouse.price <= 0) {
      setMessage('Error: A valid price is required.');
      return;
    }
    if (!newHouse.num_bedrooms || isNaN(newHouse.num_bedrooms) || newHouse.num_bedrooms <= 0) {
      setMessage('Error: Number of bedrooms is required and must be a positive number.');
      return;
    }
    if (!newHouse.num_bathrooms || isNaN(newHouse.num_bathrooms) || newHouse.num_bathrooms <= 0) {
      setMessage('Error: Number of bathrooms is required and must be a positive number.');
      return;
    }

    try {
      if (isEditing) {
        await axiosInstance.put(`/houses/update/${editingHouseId}`, newHouse);
        setHouses((prevHouses) =>
          prevHouses.map((house) =>
            house.house_id === editingHouseId ? { ...house, ...newHouse } : house
          )
        );
        setMessage('House updated successfully.');
        setIsEditing(false);
        setEditingHouseId(null);
      } else {
        const response = await axiosInstance.post('/houses/', newHouse);
        setHouses((prevHouses) => [...prevHouses, response.data]);
        setMessage('House added successfully.');
      }

      setNewHouse({
        title: '',
        description: '',
        price: '',
        num_bedrooms: '',
        num_bathrooms: '',
        area_sqft: '',
        location: '',
        image_url: '',
        name: '', // Reset name
      });
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to add/update house. Please try again later.');
    }
  };

  const handleEditHouse = (houseId) => {
    const houseToEdit = houses.find((house) => house.house_id === houseId);
    setNewHouse(houseToEdit);
    setIsEditing(true);
    setEditingHouseId(houseId);
    setIsFormVisible(true);
  };

  const handleDeleteHouse = async (houseId) => {
    try {
      await axiosInstance.delete(`/houses/delete/${houseId}`);
      setHouses(houses.filter((house) => house.house_id !== houseId));
      setMessage('House deleted successfully.');
    } catch (error) {
      console.error('Error deleting house:', error);
      setMessage('Failed to delete house.');
    }
  };

  return (
    <Layout>
      <div className={classes.manageHouse}>
        {message && <div className={classes.successMessage}>{message}</div>}

        {!isFormVisible && (
          <>
            <div className={classes.buttonbox}>
              <button onClick={() => setIsFormVisible(true)} className={classes.addButton}>Add House</button>
            </div>
            <table className={classes.houseTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Bedrooms</th>
                  <th>Bathrooms</th>
                  <th>Area (sqft)</th>
                  <th>Location</th>
                  <th>Broker name</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {houses?.map((house) => (
                  <tr key={house?.house_id}>
                    <td>{house?.title}</td>
                    <td>{house?.description}</td>
                    <td>{house?.price}</td>
                    <td>{house?.num_bedrooms}</td>
                    <td>{house?.num_bathrooms}</td>
                    <td>{house?.area_sqft}</td>
                    <td>{house?.location}</td>
                    <td>{brokers?.find((broker) => broker?.broker_id === house?.broker_id)?.name}</td>
                    <td>
                      <img
                        src={house.image_url
                          ? house.image_url.startsWith('http')
                            ? house.image_url
                            : `${baseURL}${house.image_url}`
                          : 'default-placeholder.jpg'}
                        alt="House"
                      />
                    </td>
                    <td>
                      <button className={classes.editButton} onClick={() => handleEditHouse(house.house_id)}>
                        <FaEdit />
                      </button>
                      <button className={classes.deleteButton} onClick={() => handleDeleteHouse(house.house_id)}>
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {isFormVisible && (
          <form className={classes.houseForm} onSubmit={handleAddHouse}>
            <h3>{isEditing ? 'Edit House' : 'Add House'}</h3>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={newHouse.title}
              onChange={handleInputChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={newHouse.description}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={newHouse.price}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="num_bedrooms"
              placeholder="Number of Bedrooms"
              value={newHouse.num_bedrooms}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="num_bathrooms"
              placeholder="Number of Bathrooms"
              value={newHouse.num_bathrooms}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="area_sqft"
              placeholder="Area (sqft)"
              value={newHouse.area_sqft}
              onChange={handleInputChange}
            />
            <textarea
              name="location"
              placeholder="Location"
              value={newHouse.location}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="image_url"
              placeholder="Image URL"
              value={newHouse.image_url}
              onChange={handleInputChange}
            />
            <select
              name="name"
              value={newHouse.name}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Broker</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
            <button type="submit">{isEditing ? 'Update House' : 'Add House'}</button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ManageHouse;
