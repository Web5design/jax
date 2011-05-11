Jax.shaders['basic'] = new Jax.Shader({  common:"shared uniform mat4 ivMatrix, mvMatrix, pMatrix, vMatrix;\nshared uniform mat3 vnMatrix, nMatrix;\n\nshared uniform vec4 materialDiffuse, materialAmbient, materialSpecular;\nshared uniform float materialShininess;\n\nshared uniform int PASS_TYPE;\n\nshared varying vec2 vTexCoords;\nshared varying vec3 vNormal, vLightDir, vSurfacePos;\nshared varying vec4 vBaseColor;\n\nconst struct LightSource {\n  int enabled;\n  int type;\n  vec3 position; // in world space\n  vec3 direction; // in world space\n  vec4 ambient, diffuse, specular;\n  float constant_attenuation, linear_attenuation, quadratic_attenuation;\n  float spotExponent, spotCosCutoff;\n};\n\nfloat calcAttenuation(const in LightSource light,\n                      in vec3 ecPosition3,\n                      out vec3 lightDirection)\n{\n//  lightDirection = vec3(vnMatrix * -light.position) - ecPosition3;\n  lightDirection = vec3(ivMatrix * vec4(light.position, 1.0)) - ecPosition3;\n  float d = length(lightDirection);\n  \n  return 1.0 / (light.constant_attenuation + light.linear_attenuation * d + light.quadratic_attenuation * d * d);\n}\n\nvoid DirectionalLight(const in LightSource light,\n                      in vec3 normal,\n                      inout vec4 ambient,\n                      inout vec4 diffuse,\n                      inout vec4 specular)\n{\n  if (PASS_TYPE == <%=Jax.Scene.AMBIENT_PASS%>)\n    ambient += light.ambient;\n  else {\n    vec3 nLDir = normalize(vnMatrix * -normalize(light.direction));\n    vec3 halfVector = normalize(nLDir + vec3(0,0,1));\n    float pf;\n    \n    float NdotD  = max(0.0, dot(normal, nLDir));\n    float NdotHV = max(0.0, dot(normal, halfVector));\n    \n    if (NdotD == 0.0) pf = 0.0;\n    else pf = pow(NdotHV, materialShininess);\n    \n    diffuse += light.diffuse * NdotD;\n    specular += light.specular * pf;\n  }\n}\n\n/* Use when attenuation != (1,0,0) */\nvoid PointLightWithAttenuation(const in LightSource light,\n                               in vec3 ecPosition3,\n                               in vec3 normal,\n                               inout vec4 ambient,\n                               inout vec4 diffuse,\n                               inout vec4 specular)\n{\n  float NdotD; // normal . light direction\n  float NdotHV;// normal . half vector\n  float pf;    // specular factor\n  float attenuation;\n  vec3 VP;     // direction from surface to light position\n  vec3 halfVector; // direction of maximum highlights\n  \n  attenuation = calcAttenuation(light, ecPosition3, VP);\n  VP = normalize(VP);\n  \n  halfVector = normalize(VP+vec3(0,0,1));\n  NdotD = max(0.0, dot(normal, VP));\n  NdotHV= max(0.0, dot(normal, halfVector));\n  \n  if (NdotD == 0.0) pf = 0.0;\n  else pf = pow(NdotHV, materialShininess);\n\n  if (PASS_TYPE == <%=Jax.Scene.AMBIENT_PASS%>)\n    ambient += light.ambient * attenuation;\n  else {\n    diffuse += light.diffuse * NdotD * attenuation;\n    specular += light.specular * pf * attenuation;\n  }\n}\n\n/* Use for better performance when attenuation == (1,0,0) */\nvoid PointLightWithoutAttenuation(const in LightSource light,\n                                  in vec3 ecPosition3,\n                                  in vec3 normal,\n                                  inout vec4 ambient,\n                                  inout vec4 diffuse,\n                                  inout vec4 specular)\n{\n  float NdotD; // normal . light direction\n  float NdotHV;// normal . half vector\n  float pf;    // specular factor\n  float d;     // distance from surface to light source\n  vec3 VP;     // direction from surface to light position\n  vec3 halfVector; // direction of maximum highlights\n  \n  VP = vec3(ivMatrix * vec4(light.position, 1.0)) - ecPosition3;\n  d = length(VP);\n  VP = normalize(VP);\n  halfVector = normalize(VP+vec3(0,0,1));\n  NdotD = max(0.0, dot(normal, VP));\n  NdotHV= max(0.0, dot(normal, halfVector));\n  \n  if (NdotD == 0.0) pf = 0.0;\n  else pf = pow(NdotHV, materialShininess);\n  \n  if (PASS_TYPE == <%=Jax.Scene.AMBIENT_PASS%>)\n    ambient += light.ambient;\n  else {\n    diffuse += light.diffuse * NdotD;\n    specular += light.specular * pf;\n  }\n}\n\nvoid SpotLight(const in LightSource light,\n               in vec3 ecPosition3,\n               in vec3 normal,\n               inout vec4 ambient,\n               inout vec4 diffuse,\n               inout vec4 specular)\n{\n  float NdotD; // normal . light direction\n  float NdotHV;// normal . half vector\n  float pf;    // specular factor\n  float attenuation;\n  vec3 VP;     // direction from surface to light position\n  vec3 halfVector; // direction of maximum highlights\n  float spotDot; // cosine of angle between spotlight\n  float spotAttenuation; // spotlight attenuation factor\n  \n  attenuation = calcAttenuation(light, ecPosition3, VP);\n  VP = normalize(VP);\n  \n  // See if point on surface is inside cone of illumination\n  spotDot = dot(-VP, normalize(vnMatrix*light.direction));\n  if (spotDot < light.spotCosCutoff)\n    spotAttenuation = 0.0;\n  else spotAttenuation = pow(spotDot, light.spotExponent);\n  \n  attenuation *= spotAttenuation;\n  \n  halfVector = normalize(VP+vec3(0,0,1));\n  NdotD = max(0.0, dot(normal, VP));\n  NdotHV= max(0.0, dot(normal, halfVector));\n  \n  if (NdotD == 0.0) pf = 0.0;\n  else pf = pow(NdotHV, materialShininess);\n  \n  if (PASS_TYPE == <%=Jax.Scene.AMBIENT_PASS%>)\n    ambient += light.ambient * attenuation;\n  else {\n    diffuse += light.diffuse * NdotD * attenuation;\n    specular += light.specular * pf * attenuation;\n  }\n}\n\n\n\nshared uniform bool LIGHTING_ENABLED;\nshared uniform LightSource LIGHT;\n",
  fragment:"void main(inout vec4 ambient, inout vec4 diffuse, inout vec4 specular) {\n  ambient = diffuse = specular = vec4(0);\n  \n  vec3 nNormal = normalize(vNormal);\n\n  if (LIGHTING_ENABLED) {\n    if (LIGHT.type == <%=Jax.DIRECTIONAL_LIGHT%>)\n      DirectionalLight(LIGHT, nNormal, ambient, diffuse, specular);\n    else\n      if (LIGHT.type == <%=Jax.POINT_LIGHT%>)\n        if (LIGHT.constant_attenuation == 1.0 && LIGHT.linear_attenuation == 0.0 && LIGHT.quadratic_attenuation == 0.0)\n          PointLightWithoutAttenuation(LIGHT, vSurfacePos, nNormal, ambient, diffuse, specular);\n        else\n          PointLightWithAttenuation(LIGHT, vSurfacePos, nNormal, ambient, diffuse, specular);\n    else\n      if (LIGHT.type == <%=Jax.SPOT_LIGHT%>)\n        SpotLight(LIGHT, vSurfacePos, nNormal, ambient, diffuse, specular);\n    else\n    { // error condition, output 100% red\n      gl_FragColor = vec4(1,0,0,1);\n      return;\n    }\n  } else {\n    ambient = diffuse = specular = vec4(1,1,1,1);\n  }\n\n  // is this correct??\n  ambient.a = 1.0;\n  \n  ambient *= materialAmbient * vBaseColor;\n  diffuse *= materialDiffuse * vBaseColor;\n  specular *= materialSpecular * vBaseColor;\n}\n",
  vertex:"shared attribute vec2 VERTEX_TEXCOORDS;\nshared attribute vec3 VERTEX_NORMAL;\nshared attribute vec4 VERTEX_POSITION, VERTEX_COLOR, VERTEX_TANGENT;\n\nvoid main(void) {\n  vBaseColor = VERTEX_COLOR;\n  vNormal = nMatrix * VERTEX_NORMAL;\n  vTexCoords = VERTEX_TEXCOORDS;\n                          \n  vLightDir = normalize(vnMatrix * -normalize(LIGHT.direction));\n  vSurfacePos = (mvMatrix * VERTEX_POSITION).xyz;\n\n  gl_Position = pMatrix * mvMatrix * VERTEX_POSITION;\n}\n",
exports: {},
name: "basic"});
