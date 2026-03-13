# Especificación de Requisitos de Software (SRS)
## Aplicación de Asistencia - Semillero de Matemáticas

### 1. Introducción
**1.1. Propósito**
El propósito de este documento es definir los requisitos de software para una aplicación móvil destinada al registro y control de asistencia de los estudiantes (monitores) pertenecientes al Semillero de Matemáticas.

**1.2. Alcance**
La aplicación permitirá a un único usuario autorizado (el profesor) iniciar sesión, visualizar las sesiones programadas (sábados), registrar la asistencia de los estudiantes y consultar un panel de control (Dashboard) con estadísticas de participación (asistencias, faltas y porcentajes). La base de datos estará alojada en Firebase.

### 2. Descripción General
**2.1. Perspectiva del Producto**
El sistema es una aplicación independiente diseñada con un enfoque *Mobile-First*, optimizada para ser utilizada desde el teléfono celular del profesor durante las sesiones presenciales del semillero. 

**2.2. Funciones del Producto**
* Autenticación segura (Login) exclusiva para el profesor.
* Visualización del listado de estudiantes clasificados por grado (9°, 10° y 11°).
* Selección de la sesión (fecha) a registrar.
* Registro rápido de asistencia (Presente/Ausente) por estudiante.
* Dashboard analítico de asistencia general e individual.

**2.3. Características del Usuario**
* **Rol Único (Profesor/Administrador):** Usuario con conocimientos básicos en el uso de aplicaciones móviles. Requiere una interfaz intuitiva, botones grandes y navegación fluida para registrar datos rápidamente.

### 3. Requisitos Funcionales (RF)
* **RF01 - Autenticación:** El sistema debe permitir el inicio de sesión del profesor mediante correo electrónico y contraseña.
* **RF02 - Gestión de Sesiones:** El sistema debe listar las fechas de las sesiones programadas, divididas en dos categorías: "Monitorias noveno, décimo y once" e "Introducción al semillero grado once".
* **RF03 - Listado de Estudiantes:** El sistema debe mostrar la lista de los monitores registrados, permitiendo filtrar o agrupar por grado académico.
* **RF04 - Registro de Asistencia:** El sistema debe permitir al profesor marcar a cada estudiante como "Asistió" o "Faltó" para la fecha seleccionada.
* **RF05 - Dashboard:** El sistema debe calcular y mostrar en tiempo real para cada estudiante:
    * Total de asistencias.
    * Total de faltas.
    * Porcentaje (%) de asistencia acumulado.

### 4. Requisitos No Funcionales (RNF)
**4.1. Interfaz y Experiencia de Usuario (UI/UX)**
* **Diseño:** Moderno, minimalista y profesional.
* **Paleta de Colores:** La aplicación heredará la identidad visual corporativa extraída del sitio web *https://escueladelideresjbr.com/* (utilizando sus colores primarios para la barra de navegación y botones de acción, colores secundarios para fondos, y colores de acento para alertas o gráficas).
* **Responsive:** Diseño estrictamente adaptado a pantallas de dispositivos móviles (Smartphones).

**4.2. Rendimiento y Base de Datos**
* **Tecnología:** Sincronización en tiempo real utilizando Firebase (Cloud Firestore).
* **Disponibilidad:** Alta disponibilidad y tiempos de respuesta menores a 2 segundos para el registro de datos.
