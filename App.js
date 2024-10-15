import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/Ionicons'; // Importă iconurile din Ionicons

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [speed, setSpeed] = useState(0.00001); // Viteza de deplasare
  const [moving, setMoving] = useState(false); // Flag pentru a controla deplasarea
  const [pinLocation, setPinLocation] = useState(null); // Coordonatele pinului

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permisiunea pentru a accesa locația a fost refuzată');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      if (currentLocation) {
        setLocation(currentLocation.coords);
        setPinLocation(currentLocation.coords); // Setează locația pinului la locația curentă
      }
    })();
  }, []);

  useEffect(() => {
    let animationFrameId;

    const updateLocation = () => {
      setLocation((prevLocation) => {
        if (!moving || !prevLocation || !pinLocation) return prevLocation;

        const deltaLat = pinLocation.latitude - prevLocation.latitude;
        const deltaLng = pinLocation.longitude - prevLocation.longitude;
        const distance = Math.sqrt(deltaLat ** 2 + deltaLng ** 2);

        if (distance < 0.00001) {
          setMoving(false);
          return prevLocation;
        }

        // Ajustăm viteza pentru a fi mai mică
        const stepLat = (deltaLat / distance) * speed;
        const stepLng = (deltaLng / distance) * speed;

        return {
          latitude: prevLocation.latitude + stepLat,
          longitude: prevLocation.longitude + stepLng,
        };
      });

      animationFrameId = requestAnimationFrame(updateLocation);
    };

    if (moving) {
      animationFrameId = requestAnimationFrame(updateLocation);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [moving, location, speed, pinLocation]);

  const handleMapPress = (e) => {
    const newLocation = e.nativeEvent.coordinate;
    setPinLocation(newLocation); // Setează locația pinului la coordonatele atinse
  };

  let text = 'Aștept locația...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `Lat: ${location.latitude.toFixed(5)}, Lng: ${location.longitude.toFixed(5)}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>{text}</Text>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onPress={handleMapPress}
        >
          {pinLocation && (
            <Marker
              coordinate={pinLocation}
              draggable
              onDragEnd={(e) => setPinLocation(e.nativeEvent.coordinate)}
            >
              <Icon name="pin" size={30} color="red" />
            </Marker>
          )}
          <Marker coordinate={location}>
            <Icon name="locate" size={30} color="blue" />
          </Marker>
        </MapView>
      )}
      <View style={styles.sliderContainer}>
        <Text>Viteza de deplasare:</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.000001} // Ajustare a valorii minime
          maximumValue={0.0001} // Ajustare a valorii maxime
          value={speed}
          onValueChange={setSpeed}
          step={0.000001} // Ajustare a pașilor pentru slider
        />
        <Text>Deplasare: {moving ? "Activă" : "Inactivă"}</Text>
        <Button
          title={moving ? "Oprește deplasarea" : "Pornește deplasarea"}
          onPress={() => setMoving(!moving)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '70%',
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 10,
  },
  slider: {
    width: '90%',
  },
  infoText: {
    marginBottom: 10,
    textAlign: 'center',
  },
});
