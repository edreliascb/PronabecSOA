IF OBJECT_ID('dbo.HistorialSeguimientos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistorialSeguimientos (
        id_historial INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_seguimiento INT NOT NULL,
        id_usuario INT NOT NULL,
        accion NVARCHAR(60) NOT NULL,
        estado_anterior NVARCHAR(50) NULL,
        estado_nuevo NVARCHAR(50) NULL,
        detalle NVARCHAR(500) NULL,
        fecha_evento DATETIME2 NOT NULL CONSTRAINT DF_HistorialSeguimientos_Fecha DEFAULT SYSDATETIME()
    );

    CREATE INDEX IX_HistorialSeguimientos_Seguimiento
        ON dbo.HistorialSeguimientos(id_seguimiento, id_usuario, fecha_evento DESC);
END;
GO
