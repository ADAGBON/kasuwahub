// Flat delivery fees (₦) by Lagos zone
export const DELIVERY_ZONES = {
  island: { id: 'island', name: 'Lagos Island', areas: 'VI, Ikoyi, Lekki, Ajah', fee: 3500 },
  mainland: { id: 'mainland', name: 'Lagos Mainland', areas: 'Yaba, Surulere, Ikeja, Ogba', fee: 2500 },
  outskirts: { id: 'outskirts', name: 'Outskirts', areas: 'Ikorodu, Badagry, Epe', fee: 5000 },
}

export const getZone = (id) => DELIVERY_ZONES[id]
