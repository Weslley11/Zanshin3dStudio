import { strToU8, zipSync } from 'fflate'

/** Cubo de lado `s` mm com um canto na origem: 12 triângulos. */
export function cubeTriangles(s = 20) {
  const v = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ]
  const f = [
    [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
    [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7],
  ]
  return { v, f }
}

export function binaryStl(s = 20) {
  const { v, f } = cubeTriangles(s)
  const buf = new ArrayBuffer(84 + f.length * 50)
  const dv = new DataView(buf)
  dv.setUint32(80, f.length, true)
  f.forEach((tri, i) => {
    const o = 84 + i * 50
    tri.forEach((vi, k) => v[vi].forEach((c, j) => dv.setFloat32(o + 12 + k * 12 + j * 4, c, true)))
  })
  return buf
}

/** .gcode.3mf no formato do Bambu Studio: objetos em arquivos separados e duas placas. */
export function bambuGcode3mf() {
  const { v, f } = cubeTriangles(20)
  const mesh = `<mesh><vertices>${v.map((p) => `<vertex x="${p[0]}" y="${p[1]}" z="${p[2]}"/>`).join('')}</vertices><triangles>${f
    .map((t) => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`)
    .join('')}</triangles></mesh>`
  const object = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources><object id="1" type="model">${mesh}</object></resources><build/></model>`
  const main = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <resources>
  <object id="2" p:UUID="00000001" type="model" name="Suporte">
   <components><component p:path="/3D/Objects/object_1.model" objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0"/></components>
  </object>
  <object id="4" type="model" name="Tampa">
   <components><component p:path="/3D/Objects/object_1.model" objectid="1" transform="0.5 0 0 0 0.5 0 0 0 0.5 0 0 0"/></components>
  </object>
 </resources>
 <build>
  <item objectid="2" transform="1 0 0 0 1 0 0 0 1 100 100 0" printable="1"/>
  <item objectid="4" transform="1 0 0 0 1 0 0 0 1 400 100 0" printable="1"/>
 </build>
</model>`
  const slice = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header><header_item key="X-BBL-Client-Type" value="slicer"/><header_item key="X-BBL-Client-Version" value="02.03.00.70"/></header>
  <plate>
    <metadata key="index" value="1"/>
    <metadata key="prediction" value="5463"/>
    <metadata key="weight" value="25.37"/>
    <object identify_id="99" name="Suporte" skipped="false"/>
    <filament id="1" tray_info_idx="GFA00" type="PLA" color="#C8100FFF" used_m="8.51" used_g="25.37"/>
  </plate>
  <plate>
    <metadata key="index" value="2"/>
    <metadata key="prediction" value="1800"/>
    <metadata key="weight" value="10.5"/>
    <object identify_id="100" name="Tampa" skipped="false"/>
    <filament id="1" type="PLA" color="#000000" used_m="2.1" used_g="6.25"/>
    <filament id="2" type="PETG" color="#FFFFFF" used_m="1.4" used_g="4.25"/>
  </plate>
</config>`
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return zipSync({
    '[Content_Types].xml': strToU8('<Types/>'),
    '_rels/.rels': strToU8('<Relationships><Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    '3D/3dmodel.model': strToU8(main),
    '3D/Objects/object_1.model': strToU8(object),
    'Metadata/slice_info.config': strToU8(slice),
    'Metadata/plate_1.png': png,
    'Metadata/plate_2.png': png,
  })
}
