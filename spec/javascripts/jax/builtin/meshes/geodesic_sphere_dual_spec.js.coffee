# fixme: require prototype methods defined in icosahedron_spec

describe "Jax.Mesh.GeodesicSphereDual", ->

  geode = null
  vertices = colors = textureCoords = vertexNormals = vertexIndices = tangents = bitangents = null

  beforeEach ->
    [vertices, colors, textureCoords, vertexNormals, vertexIndices, tangents, bitangents] = [[], [], [], [], [], [], []]


  for subdivisions in [0..3] by 1

    describe "With "+subdivisions+" subdivision(s)", ->

      _subdivisions = subdivisions

      beforeEach ->
        # maybe extract this from beforeEach, to speed up tests
        geode = new Jax.Mesh.GeodesicSphereDual({subdivisions: _subdivisions})

      it "should build successfully", ->
        geode.init vertices, colors, textureCoords, vertexNormals, vertexIndices, tangents, bitangents
        expect(vertices.length).toBeGreaterThan(0)

      it "should rebuild successfully", ->
        for i in [0..10] by 1
          geode.rebuild()
          expect(geode.data.vertexBuffer.length).toBeGreaterThan(0)

      it "should render successfully", ->
        geode.render SPEC_CONTEXT


      describe "its vertices", ->

        vertices = uniqueVertices = null
        expectedVerticesLength = 180 * Math.pow(4,_subdivisions)

        beforeEach ->
          vertices = geode.getVerticesAsVectors()
          uniqueVertices = Jax.Util.trimDuplicates vertices

        it "should be "+expectedVerticesLength+" overall", ->
          expect(vertices.length).toBe(expectedVerticesLength)

        it "should regroup in "+(2 + expectedVerticesLength / 6)+" unique vertices", ->
          # 12 vertices will touch 5 faces, the rest 6
          expect(uniqueVertices.length).toBe(2 + expectedVerticesLength / 6)


      describe "its triangular faces", ->

        faces = null
        # 12 pentagons, 10 * (Math.pow(4,subdivisions) - 1) hexagons
        expectedFacesLength = 60 * Math.pow(4,_subdivisions)

        beforeEach ->
          faces = geode.getFacesAsTriangles()

        it "should be "+(expectedFacesLength), ->
          expect(faces.length).toBe(expectedFacesLength)


      describe "its pentagonal faces", ->

        it "should be readable at #pentagons", ->
          expect(geode.pentagons).not.toBeUndefined()

        it "should be 12 instances of Jax.SubMesh.Pentagon", ->
          geode.init vertices, colors, textureCoords, vertexNormals, vertexIndices, tangents, bitangents
          pentagonsCount = geode.pentagons.length
          expect(pentagonsCount).toBe(12)
          for pentagon in geode.pentagons
            expect(pentagon).toBeInstanceOf(Jax.SubMesh.Pentagon)


      describe "its hexagonal faces", ->

        expectedHexagonsCount = 10 * (Math.pow(4,subdivisions) - 1)

        it "should be readable at #hexagons", ->
          expect(geode.hexagons).not.toBeUndefined()

        it "should be "+expectedHexagonsCount+" instances of Jax.SubMesh.Hexagon", ->
          geode.init vertices, colors, textureCoords, vertexNormals, vertexIndices, tangents, bitangents
          hexagonsCount = geode.hexagons.length
          expect(hexagonsCount).toBe(expectedHexagonsCount)
          for hexagon in geode.hexagons
            expect(hexagon).toBeInstanceOf(Jax.SubMesh.Hexagon)
