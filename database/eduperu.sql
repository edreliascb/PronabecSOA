/* =========================================================
   EDUPERÚ SOA
   BASE DE DATOS PRINCIPAL
   SQL SERVER
========================================================= */


USE master;
GO


/* =========================================================
   CREAR BASE DE DATOS
========================================================= */

IF NOT EXISTS (
    SELECT
        name
    FROM
        sys.databases
    WHERE
        name = 'EduPeruDB'
)
BEGIN

    CREATE DATABASE EduPeruDB;

END;
GO


USE EduPeruDB;
GO


/* =========================================================
   TABLA USUARIOS
========================================================= */

IF NOT EXISTS (
    SELECT
        *
    FROM
        sys.objects
    WHERE
        object_id =
            OBJECT_ID(
                N'[dbo].[Usuarios]'
            )
        AND
        type = N'U'
)
BEGIN

    CREATE TABLE dbo.Usuarios
    (

        id_usuario INT
            IDENTITY(1,1)
            PRIMARY KEY,


        nombres NVARCHAR(100)
            NOT NULL,


        apellidos NVARCHAR(100)
            NOT NULL,


        email NVARCHAR(180)
            NOT NULL
            UNIQUE,


        password_hash NVARCHAR(255)
            NOT NULL,


        rol NVARCHAR(30)
            NOT NULL
            DEFAULT 'ESTUDIANTE',


        activo BIT
            NOT NULL
            DEFAULT 1,


        fecha_creacion DATETIME2
            NOT NULL
            DEFAULT SYSDATETIME(),


        fecha_actualizacion DATETIME2
            NULL,


        CONSTRAINT CK_Usuarios_Rol
        CHECK (
            rol IN (
                'ESTUDIANTE',
                'ADMINISTRADOR',
                'OPERADOR'
            )
        )

    );

END;
GO


/* =========================================================
   ÍNDICE EMAIL
========================================================= */

IF NOT EXISTS (
    SELECT
        *
    FROM
        sys.indexes
    WHERE
        name = 'IX_Usuarios_Email'
        AND
        object_id =
            OBJECT_ID(
                'dbo.Usuarios'
            )
)
BEGIN

    CREATE INDEX IX_Usuarios_Email
        ON dbo.Usuarios(email);

END;
GO


/* =========================================================
   TABLA PERFILES
========================================================= */

IF NOT EXISTS (
    SELECT
        *
    FROM
        sys.objects
    WHERE
        object_id =
            OBJECT_ID(
                N'[dbo].[PerfilesUsuario]'
            )
        AND
        type = N'U'
)
BEGIN

    CREATE TABLE dbo.PerfilesUsuario
    (

        id_perfil INT
            IDENTITY(1,1)
            PRIMARY KEY,


        id_usuario INT
            NOT NULL
            UNIQUE,


        departamento NVARCHAR(100)
            NULL,


        provincia NVARCHAR(100)
            NULL,


        distrito NVARCHAR(100)
            NULL,


        carrera_interes NVARCHAR(150)
            NULL,


        nivel_estudio NVARCHAR(100)
            NULL,


        institucion NVARCHAR(180)
            NULL,


        fecha_actualizacion DATETIME2
            NULL,


        CONSTRAINT FK_PerfilesUsuario_Usuarios
        FOREIGN KEY (
            id_usuario
        )
        REFERENCES dbo.Usuarios(
            id_usuario
        )
        ON DELETE CASCADE

    );

END;
GO


/* =========================================================
   TABLA FAVORITOS
========================================================= */

IF NOT EXISTS (
    SELECT
        *
    FROM
        sys.objects
    WHERE
        object_id =
            OBJECT_ID(
                N'[dbo].[Favoritos]'
            )
        AND
        type = N'U'
)
BEGIN

    CREATE TABLE dbo.Favoritos
    (

        id_favorito INT
            IDENTITY(1,1)
            PRIMARY KEY,


        id_usuario INT
            NOT NULL,


        tipo NVARCHAR(50)
            NOT NULL
            DEFAULT 'OPORTUNIDAD',


        referencia NVARCHAR(250)
            NULL,


        datos_json NVARCHAR(MAX)
            NOT NULL,


        fecha_creacion DATETIME2
            NOT NULL
            DEFAULT SYSDATETIME(),


        CONSTRAINT FK_Favoritos_Usuarios
        FOREIGN KEY (
            id_usuario
        )
        REFERENCES dbo.Usuarios(
            id_usuario
        )
        ON DELETE CASCADE

    );

END;
GO


/* =========================================================
   TABLA ALERTAS
========================================================= */

IF NOT EXISTS (
    SELECT
        *
    FROM
        sys.objects
    WHERE
        object_id =
            OBJECT_ID(
                N'[dbo].[Alertas]'
            )
        AND
        type = N'U'
)
BEGIN

    CREATE TABLE dbo.Alertas
    (

        id_alerta INT
            IDENTITY(1,1)
            PRIMARY KEY,


        id_usuario INT
            NOT NULL,


        nombre NVARCHAR(100)
            NOT NULL,


        palabra_clave NVARCHAR(150)
            NULL,


        region NVARCHAR(100)
            NULL,


        activa BIT
            NOT NULL
            DEFAULT 1,


        fecha_creacion DATETIME2
            NOT NULL
            DEFAULT SYSDATETIME(),


        CONSTRAINT FK_Alertas_Usuarios
        FOREIGN KEY (
            id_usuario
        )
        REFERENCES dbo.Usuarios(
            id_usuario
        )
        ON DELETE CASCADE

    );

END;
GO


/* =========================================================
   COMPROBACIÓN
========================================================= */

SELECT
    name
FROM
    sys.tables
ORDER BY
    name;
GO