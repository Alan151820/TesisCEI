class ParadaReparto {
  constructor(data) {
    this.id = data.id
    this.planRepartoId = data.plan_reparto_id
    this.pedidoId = data.pedido_id
    this.orden = data.orden
    this.estadoParada = data.estado_parada
    this.motivo = data.motivo
  }
}

export default ParadaReparto
