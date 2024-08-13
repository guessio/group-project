let masterId = null; // ID from RM
let currentNumber = null; // Angka yang harus ditebak
let players = [];
let isGameOver = false;

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    // Handle player joining the game
    socket.on('join_game', (username) => {
      players.push({ id: socket.id, username })
      io.emit('player_list', players)

      // Set player as master if they are the first one to join
      if (players.length === 1) {
        masterId = socket.id
        socket.emit('set_as_master')
      }
    });

    // RM set the number
    socket.on('set_number', (number) => {
      if (socket.id === masterId && !currentNumber) {
        currentNumber = number
        io.emit('game_started')
      }
    });

    // Handle player guessing a number
    socket.on('guess_number', ({ username, guess }) => {
      if (isGameOver || !currentNumber) return

      if (guess === currentNumber) {
        isGameOver = true
        io.emit('game_over', { winner: username, number: currentNumber })
      } else {
        io.emit('guess_result', { username, guess })
      }
    })

    // Handle player disconnecting
    socket.on('disconnect', () => {
      players = players.filter(player => player.id !== socket.id)

      // reset the game if RM dc
      if (socket.id === masterId) {
        resetGame()
      }

      io.emit('player_list', players)
      console.log('A user disconnected', socket.id);
    })
  })

  const resetGame = () => {
    masterId = null
    currentNumber = null
    isGameOver = false
    players = []
    io.emit('game_reset')
  }
}
