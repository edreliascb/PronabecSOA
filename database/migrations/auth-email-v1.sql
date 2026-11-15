USE EduPeruDB;
GO

IF OBJECT_ID('dbo.UsuarioEmailEstado', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuarioEmailEstado (
        id_usuario INT NOT NULL CONSTRAINT PK_UsuarioEmailEstado PRIMARY KEY,
        email_verificado BIT NOT NULL CONSTRAINT DF_UsuarioEmailEstado_Verificado DEFAULT (0),
        fecha_verificacion DATETIME2(0) NULL,
        fecha_actualizacion DATETIME2(0) NOT NULL CONSTRAINT DF_UsuarioEmailEstado_Actualizacion DEFAULT (SYSDATETIME()),
        CONSTRAINT FK_UsuarioEmailEstado_Usuarios FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario)
    );
END;
GO

IF OBJECT_ID('dbo.AuthTokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthTokens (
        id_token BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuthTokens PRIMARY KEY,
        id_usuario INT NOT NULL,
        tipo NVARCHAR(30) NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expira_en DATETIME2(0) NOT NULL,
        usado BIT NOT NULL CONSTRAINT DF_AuthTokens_Usado DEFAULT (0),
        fecha_uso DATETIME2(0) NULL,
        ip_solicitud NVARCHAR(64) NULL,
        creado_en DATETIME2(0) NOT NULL CONSTRAINT DF_AuthTokens_Creado DEFAULT (SYSDATETIME()),
        CONSTRAINT UQ_AuthTokens_Hash UNIQUE (token_hash),
        CONSTRAINT FK_AuthTokens_Usuarios FOREIGN KEY (id_usuario) REFERENCES dbo.Usuarios(id_usuario),
        CONSTRAINT CK_AuthTokens_Tipo CHECK (tipo IN ('VERIFICAR_EMAIL', 'RESET_PASSWORD'))
    );

    CREATE INDEX IX_AuthTokens_UsuarioTipoEstado
        ON dbo.AuthTokens (id_usuario, tipo, usado, expira_en);
END;
GO

SELECT 'UsuarioEmailEstado' AS tabla, COUNT(*) AS filas FROM dbo.UsuarioEmailEstado
UNION ALL
SELECT 'AuthTokens', COUNT(*) FROM dbo.AuthTokens;
GO
