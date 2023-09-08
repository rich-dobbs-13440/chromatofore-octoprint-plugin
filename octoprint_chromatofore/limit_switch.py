
class LimitSwitch:
    def __init__(self, data):
        self.board = data.get("board")
        self.channel = data.get("channel")
        self.role = data.get("role")

    def to_data(self):
        return {
            'board': self.board,
            'channel': self.channel,
            'role': self.role
        }


    def __str__(self):
        board = f"0x{self.board:02X}" if  isinstance(self.board, int) else f"{self.board}"
        return f"LimitSwitch(Role: {self.role}, Board: {board}, Channel: {self.channel})"


    def __repr__(self):
        board = f"0x{self.board:02X}" if  isinstance(self.board, int) else f"{self.board}"
        return f"LimitSwitch(data={{'board': board, 'channel': {self.channel}, 'role': {repr(self.role)}}})"
    
    def unique_hash(self):
        essential_data = (self.board, self.channel)
        return f"{hash(essential_data):08x}"
