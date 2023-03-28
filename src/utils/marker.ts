export const budeMarker = (map: google.maps.Map, position: google.maps.LatLng | google.maps.LatLngLiteral, title?: string) => {
  const size = new google.maps.Size(30, 60, 'px', 'px')
  const anchor = new google.maps.Point(size.width / 2, size.height)

  return new google.maps.Marker({
    map,
    position,
    title,
    icon: {
      url: '/bude.svg',
      size,
      anchor,
      scaledSize: size
    }
  })
}

export const editingBudeMarker = (map: google.maps.Map, position: google.maps.LatLng | google.maps.LatLngLiteral, title?: string) => {
  const size = new google.maps.Size(30, 60, 'px', 'px')
  const anchor = new google.maps.Point(size.width / 2, size.height)

  return new google.maps.Marker({
    map,
    position,
    title,
    icon: {
      url: '/editingBude.svg',
      size,
      anchor,
      scaledSize: size
    }
  })
}